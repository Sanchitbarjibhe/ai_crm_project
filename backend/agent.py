import os
from typing import Annotated, TypedDict
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from database import SessionLocal, Interaction
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition

# Load environment variables from .env file
load_dotenv()

# 1. LLM Setup
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.2,
    api_key=os.environ.get("API_KEY"),
    timeout=60.0  
)

class LogInteractionSchema(BaseModel):
    hcp_name: str = Field(description="Name of the Healthcare Professional/Doctor")
    interaction_type: str = Field(description="Type of interaction, e.g., 'Call', 'In-Person Meeting', 'Email'")
    summary: str = Field(description="Summary of what was discussed")

@tool(args_schema=LogInteractionSchema)
def log_interaction_tool(hcp_name: str, interaction_type: str, summary: str) -> str:
    """Use this tool to save/log a new interaction with a Healthcare Professional."""
    db = SessionLocal()
    try:
        new_log = Interaction(
            hcp_name=hcp_name, 
            interaction_type=interaction_type, 
            summary=summary,
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log) # To generate the database ID
        print(f"--- SUCCESS: DB entry created for {hcp_name} ---") # For understanding from the terminal
        return f"Success: Interaction with Dr. {hcp_name} has been saved successfully with Interaction ID: {new_log.id}."
    except Exception as e:
        db.rollback()
        print(f"--- DB ERROR: {str(e)} ---")
        return f"Error logging interaction: {str(e)}"
    finally:
        db.close()

class EditInteractionSchema(BaseModel):
    interaction_id: int = Field(description="The database ID of the interaction to modify.")
    hcp_name: str = Field(default=None, description="The new name of the Healthcare Professional.")
    interaction_type: str = Field(default=None, description="The new type of interaction.")
    summary: str = Field(default=None, description="The new summary of the interaction.")

@tool(args_schema=EditInteractionSchema)
def edit_interaction_tool(interaction_id: int, hcp_name: str = None, interaction_type: str = None, summary: str = None) -> str:
    """Use this tool to modify or edit an existing logged interaction using its database ID."""
    db = SessionLocal()
    try:
        # Find the entry for the given ID in the database
        log = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not log:
            return f"Error: Interaction ID {interaction_id} not found."

        # Only update the parameters sent by the AI
        if hcp_name:
            log.hcp_name = hcp_name
        if interaction_type:
            log.interaction_type = interaction_type
        if summary:
            log.summary = summary
            
        db.commit()
        db.refresh(log)
        return f"Success: Interaction ID {interaction_id} has been successfully updated."
    except Exception as e:
        db.rollback()
        return f"Error updating interaction: {str(e)}"
    finally:
        db.close()

@tool
def get_hcp_history_tool(hcp_name: str) -> str:
    """Use this tool to fetch the interaction history of a specific HCP/Doctor."""
    db = SessionLocal()
    logs = db.query(Interaction).filter(Interaction.hcp_name.like(f"%{hcp_name}%")).all()
    db.close()
    if not logs:
        return f"No previous interactions found for Dr. {hcp_name}."
    
    history = ""
    for l in logs:
        history += f"ID: {l.id} | Type: {l.interaction_type} | Summary: {l.summary}\n"
    return history

@tool
def delete_interaction_tool(interaction_id: int) -> str:
    """Use this tool to delete a specific interaction from the database using its ID."""
    db = SessionLocal()
    try:
        log = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not log:
            return f"Error: Interaction ID {interaction_id} not found."
        
        db.delete(log)
        db.commit()
        return f"Success: Interaction ID {interaction_id} has been deleted."
    except Exception as e:
        db.rollback()
        return f"Error deleting interaction: {str(e)}"
    finally:
        db.close()

@tool
def search_product_info_tool(product_name: str) -> str:
    """Use this tool to fetch medical/pharma product information for sales representation."""
    # Mock data for Life Sciences Context
    products = {
        "cardioflex": "CardioFlex 10mg: Used for hypertension. Side effects include mild dizziness. Competitor: HyperStop.",
        "diabex": "Diabex 500mg: Metformin formula for Type-2 Diabetes. To be taken post-meal."
    }
    return products.get(product_name.lower(), f"Product '{product_name}' details not found in CRM database.")

# --- LangGraph Graph Setup ---

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

# Map the list of tools
tools = [
    log_interaction_tool,      # This will be at the top
    edit_interaction_tool, 
    get_hcp_history_tool,
    delete_interaction_tool,
    search_product_info_tool
    ]
llm_with_tools = llm.bind_tools(tools)

def chatbot_node(state):
    messages = state["messages"]
    
    # Add a system message to clearly remind the AI to use the tool
    system_prompt = SystemMessage(
        content="You are a CRM assistant. Once you successfully execute the log_interaction_tool to save data, you MUST immediately stop calling any tools and respond to the user with a final short text summary confirming the save. Do NOT call the tool again for the same request."
    )
    
    # Call the model by adding the system message at the beginning
    
    response = llm_with_tools.invoke([system_prompt] + messages)
    return {"messages": [response]}

# Build the graph
# --- Build the graph ---
builder = StateGraph(AgentState)

# 1. Add nodes
builder.add_node("chatbot", chatbot_node)

# 👇 Add the new tool node and condition code here
from langgraph.prebuilt import ToolNode, tools_condition

tool_node = ToolNode(tools)
builder.add_node("tools", tool_node)

# 2. Add Edges (Connections)
builder.add_edge(START, "chatbot")

# ⚠️ Remove the old line (builder.add_edge("chatbot", END)) and add these 2 lines instead:
builder.add_conditional_edges("chatbot", tools_condition)
builder.add_edge("tools", "chatbot")

# 3. Compile
agent_graph = builder.compile()