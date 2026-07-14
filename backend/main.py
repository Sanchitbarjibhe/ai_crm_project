from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from database import get_db, Interaction
from sqlalchemy.orm import Session
from agent import agent_graph

app = FastAPI(title="AI-First CRM HCP Module Backend")

# Allow CORS policy to connect with the React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class FormInteractionRequest(BaseModel):
    hcp_name: str
    interaction_type: str
    summary: str

class ScheduleRequest(BaseModel):
    next_follow_up: str = Field(..., example="2026-07-20T10:00")

# API to handle conversational chat with the LangGraph agent
@app.post("/api/chat")
def chat_with_crm_agent(request: ChatRequest):
    inputs = {"messages": [("user", request.message)]}
    
    # Run LangGraph
    result = agent_graph.invoke(inputs)
    
    # Extract the last message from the AI or tool
    ai_message = result["messages"][-1].content
    
    # If the last message is empty, check the second-to-last message from the graph (from the tool)
    if not ai_message and len(result["messages"]) > 1:
        ai_message = result["messages"][-2].content
        
    return {"response": ai_message}

# API to log a new interaction from the structured form
@app.post("/api/form-log")
def log_via_form(req: FormInteractionRequest, db: Session = Depends(get_db)):
    """Structured Form Logging Endpoint"""
    new_log = Interaction(hcp_name=req.hcp_name, interaction_type=req.interaction_type, summary=req.summary)
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return {"status": "success", "data": new_log}

# API to get all recent interaction logs
@app.get("/api/interactions")
def get_all_interactions(db: Session = Depends(get_db)):
    return db.query(Interaction).order_by(Interaction.id.asc()).all()

# API to get the interaction history for a specific HCP
@app.get("/api/interactions/history/{hcp_name}")
def get_hcp_history_api(hcp_name: str, db: Session = Depends(get_db)):
    # Find all logs in the database that match the doctor's name
    logs = db.query(Interaction).filter(Interaction.hcp_name.like(f"%{hcp_name}%")).all()
    if not logs:
        raise HTTPException(status_code=404, detail=f"No history found for Dr. {hcp_name}")
    return logs

# API to update an existing interaction's details
@app.put("/api/interactions/{interaction_id}")
def update_interaction(interaction_id: int, request: FormInteractionRequest, db: Session = Depends(get_db)):
    log = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    # Update data from the incoming request
    log.hcp_name = request.hcp_name
    log.interaction_type = request.interaction_type
    log.summary = request.summary
    
    db.commit()
    db.refresh(log)
    return {"status": "success", "message": "Updated successfully"}

# API to delete an interaction
@app.delete("/api/interactions/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    log = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    db.delete(log)
    db.commit()
    return {"status": "success", "message": "Deleted successfully"}

# API to schedule a follow-up for an interaction
@app.put("/api/interactions/schedule/{interaction_id}")
def schedule_follow_up(interaction_id: int, request: ScheduleRequest, db: Session = Depends(get_db)):
    log = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Interaction not found")

    # Save the date from the frontend into the 'next_follow_up' column
    log.next_follow_up = request.next_follow_up
    
    db.commit()
    db.refresh(log)
    return {"status": "success", "message": f"Follow-up scheduled on {log.next_follow_up}"}

# API to search for product information
@app.get("/api/products/{product_name}")
def search_product_api(product_name: str):
    # Mock product data, similar to the data in agent.py
    products = {
        "cardioflex": "Cardioflex 10mg: Used for hypertension. Side effects include mild dizziness. Dosage: Once daily.",
        "diabex": "Diabex 500mg: Metformin formula for Type-2 Diabetes. To be taken post-meals. Side effects: Stomach upset."
    }
    
    info = products.get(product_name.lower())
    if not info:
        raise HTTPException(status_code=404, detail=f"Product '{product_name}' details not found.")
    
    return {"product": product_name, "details": info}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)