<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1J4d41c1G5Eq_H99jUBbXb7cu8-yXNSpB

## Run Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup (FastAPI)
The backend handles data persistence and API requests.

```bash
# Navigate to the project root
cd boxbrain

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the server
uvicorn backend.main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`.

### 2. Frontend Setup (React)
The frontend is a Vite-based React application.

```bash
# Open a new terminal and navigate to the project root
cd boxbrain

# Install dependencies
npm install

# Run the development server
npm run dev
```
The app will be available at `http://localhost:3001`.
