import os
from typing import Annotated, TypedDict
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from database import SessionLocal, Interaction
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition


os.environ["GROQ_API_KEY"] = "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"

# 1. LLM Setup
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.2)


@tool
def log_interaction_tool(hcp_name: str, interaction_type: str, summary: str):
    """Use this tool to save/log a new interaction with a Healthcare Professional."""
    db = SessionLocal()
    try:
        # ⚠️ Check the parameters carefully here:
        new_log = Interaction(
            hcp_name=hcp_name, 
            interaction_type=interaction_type, 
            summary=summary
            # If the model has next_follow_up, add that too, otherwise this is sufficient
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log) # To generate the database ID
        print(f"--- SUCCESS: DB entry created for {hcp_name} ---") # For understanding from the terminal
        return f"Success: Interaction with Dr. {hcp_name} has been saved."
    except Exception as e:
        db.rollback()
        print(f"--- DB ERROR: {str(e)} ---")
        return f"Error logging interaction: {str(e)}"
    finally:
        db.close()

@tool
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
def schedule_follow_up_tool(hcp_name: str, date_time: str) -> str:
    """Use this tool to schedule a follow-up meeting or call with an HCP."""
    return f"Success: Follow-up scheduled with Dr. {hcp_name} on {date_time}."

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
    schedule_follow_up_tool,
    search_product_info_tool
    ]
llm_with_tools = llm.bind_tools(tools)

def chatbot_node(state):
    messages = state["messages"]
    
    # Add a system message to clearly remind the AI to use the tool
    system_prompt = SystemMessage(
        content="You are an AI CRM assistant. If the user asks to log, save, edit, or record a phone call, meeting, or interaction with a doctor (HCP), you MUST call the appropriate tool (e.g., log_interaction_tool) with the correct arguments. Do not just reply with text, always trigger the tool."
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