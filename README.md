<h1 align="center">ZeroBite</h1>
<p align="center">A Real-Time Food Donation and Waste Management System</p>


## Overview
**ZeroBite** is a real-time web-based Food Redistribution and Waste Management System that bridges the gap between **restaurants, event organizers, and individual donors** with **NGOs and charitable organizations**.  
The platform aims to reduce food wastage by efficiently redistributing surplus food before it expires.

Through a simple and interactive interface, donors can post available food items along with details such as **quantity, location, and expiry time**, while NGOs can **view, request, and collect food donations** within their vicinity.  
The system integrates **Google Maps API** for live location tracking, helping NGOs find the quickest route to the donor’s location.

ZeroBite is built using a modern **full-stack architecture** — the **React.js frontend** provides a responsive and user-friendly interface, while the **Django REST Framework** handles backend logic, authentication, and communication with the **MySQL database**.  
The system also includes an **Automatic Expiry Management Module** that removes expired donations to maintain food safety and reliability.

By combining **automation, geolocation, and real-time data updates**, ZeroBite creates a transparent and efficient digital ecosystem for food redistribution.  
It not only helps reduce food waste but also supports hunger relief efforts by ensuring that edible food reaches people in need on time.

## Folder Structure Overview
The repository contains both **frontend** and **backend** source codes along with essential project documentation and media.  
Each folder and file is organized to ensure easy understanding and setup.

```
ZeroBite/
│
├── Source Code/                 # Contains complete backend and frontend project files
│   ├── zerobite-backend/           # Django backend project folder
│   └── zerobite-frontend/          # React frontend project folder
│
├── README.md                    # Project overview and setup instructions
├── Zerobite Abstract.docx       # Project abstract document
├── Zerobite Project Report.docx # Detailed project report
├── Zerobite_demo_video           # Recorded demo video of the system
└── Zerobite Project ppt.pdf     # Project ppt
```

## How to Run the Project

### Backend Setup (Django)
```bash
cd zerobite-backend

# Create virtual environment
python -m venv venv

# Activate environment
venv\Scripts\activate   # For Windows
# or
source venv/bin/activate  # For Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py makemigrations
python manage.py migrate

# Start the backend server
python manage.py runserver
Backend runs on: http://127.0.0.1:8000
```
### Frontend Setup (React)
```bash
cd zerobite-frontend

# Install dependencies
npm install

# Start frontend development server
npm start
Frontend runs on: http://localhost:3000
```
### Technologies Used
| **Part**     | **Technology**                                                                                          | **Purpose**                                        |
| ------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Frontend** | <img src="https://img.shields.io/badge/React-blue?logo=react&logoColor=white" />                        | Built the entire user interface for NGOs and Restaurants.          |
|              | <img src="https://img.shields.io/badge/SCSS-pink?logo=sass&logoColor=white" />                          | Used for styling and designing responsive layouts.                 |
|              | <img src="https://img.shields.io/badge/React%20Router%20DOM-orange?logo=reactrouter&logoColor=white" /> | Used for page navigation between login, register, and dashboard.   |
|              | <img src="https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white" />                      | Handled API requests to connect frontend with backend.             |
|              | <img src="https://img.shields.io/badge/Google%20Maps%20API-lightgrey?logo=googlemaps&logoColor=blue" /> | Integrated live map tracking for donations and pickup points.      |
| **Backend**  | <img src="https://img.shields.io/badge/Django-green?logo=django&logoColor=white" />                     | Main backend framework managing logic and database operations.     |
|              | <img src="https://img.shields.io/badge/Django%20REST%20Framework-red?logo=django&logoColor=white" />    | Built RESTful APIs for communication between frontend and backend. |
|              | <img src="https://img.shields.io/badge/MySQL-blue?logo=mysql&logoColor=white" />                        | Stored user information, donation data, and NGO details.           |
|              | <img src="https://img.shields.io/badge/JWT-orange?logo=jsonwebtokens&logoColor=white" />                | Implemented secure login system with token-based authentication.   |


## Features
- User Authentication: Separate roles for Restaurant and NGO
- Live Map Integration: View real-time donation locations
- Automatic Expiry Check: Removes expired food donations
- Live Status Updates: Instant communication between donors and NGOs
- Database Integration: MySQL-based structured data storage
- Modern UI: Clean, responsive React interface
  

## Future Enhancements
- AI-based food prediction for smarter donations
- Mobile app version for Android and iOS
- Smart scheduling for donation timing


## Team Details
**Project Title:** ZeroBite – A Real-Time Food Donation and Waste Management System

**Team Members:**  
- Alin Jebitha B – 211423104032  
- Amrin Joshiga A – 211423104036

**Guide:** Mrs. K. Cinthuja

## Project Demo
**Demo Link:** [Watch Project Demo on Google Drive](https://drive.google.com/file/d/1fdRRJz4JECmPX2tRPfO3uw02Nh5NtvAM/view?usp=drive_link)  

**Description:** Demonstrates how ZeroBite connects restaurants and NGOs through real-time food donation tracking and management.

## Conclusion
**Summary:** ZeroBite reduces food wastage by linking donors and NGOs through a smart, real-time web platform.  
It bridges the gap between surplus food providers and organizations in need — promoting community responsibility and sustainable food management.

![Visitors](https://komarev.com/ghpvc/?username=Alinjebi90&repo=ZeroBite&label=🍴%20Visitors&color=00c853&style=for-the-badge)
