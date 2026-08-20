# Memorai

An AI Companion That Actually Remembers You. Memorai uses a dual-memory architecture (SQLite Vectors + Ladybug Knowledge Graph) to store, relate, and recall context seamlessly across conversations.

---

## 🚀 How to Run the Project

Since this is a full-stack application, you need to run both the Backend (FastAPI) and the Frontend (Next.js) simultaneously in two separate terminal windows.

### 1. Running the Backend (FastAPI)
The backend manages the memory databases, LLM extraction, and API endpoints.

**Prerequisites**: Python 3.12+

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install the dependencies (uv is the source of truth — see backend/pyproject.toml)
uv sync
# Or, if you must use pip: pip install fastapi uvicorn msgspec 'bcrypt>=4.2' pyjwt \
#   tortoise-orm aerich 'ladybug>=0.19.1' rank-bm25 openai python-dotenv email-validator

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```
*The API will be running at http://localhost:8000*

---

### 2. Running the Frontend (Next.js)
The frontend is the React-based chat interface.

**Prerequisites**: Node.js (v18+)

```bash
# Open a NEW terminal window and navigate to the frontend directory
cd frontend

# Install the Node dependencies
npm install

# Start the development server
npm run dev
```
*The app will be running at http://localhost:3000*

---

## 🛠️ Architecture Overview
* **Frontend**: Next.js 16, React 19, Tailwind CSS, Framer Motion.
* **Backend**: FastAPI, Python 3.12, msgspec for high-speed serialization.
* **Database**: Embedded SQLite via Tortoise ORM (Vector search) + Ladybug (Knowledge Graph).

## 📄 Documentation
For deep technical dives, refer to the `docs/` folder in this repository:
1. `01_PRD.md` - Product Requirements & Vision
2. `02_TRD.md` - Technology Stack specifics
3. `04_HLD.md` - System Request Flow & Architecture
4. `05_LLD.md` - Database Schemas & API specs
5. `09_Project_Structure.md` - Backend Domain-Driven Design layout
