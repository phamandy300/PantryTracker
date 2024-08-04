Here’s the updated README with your dependencies:

---

# Inventory Management Website

A modern inventory management application built with Next.js and Material UI. This project includes a Firebase backend for data storage, a responsive frontend design, and advanced features like image recognition using TensorFlow.js.

Visit it [here](https://inventory-manager-pearl.vercel.app/)

## Features

- **Next.js Setup:** Utilizes Next.js for server-side rendering and static site generation.
- **Material UI Components:** Provides a sleek and modern UI using Material UI.
- **Firebase Backend:** Stores and manages inventory data with Firebase.
- **CRUD Operations:** Form to add, delete, and update pantry items.
- **Search & Filter:** Easily find items with integrated search and filter functionality.
- **Responsive Design:** Presentable front end to display all pantry items.
- **Deployment:** Deployed to Vercel with CI/CD for continuous integration and delivery.
- **Image Recognition:** Implemented TensorFlow.js port of the COCO-SSD model for image recognition.

## Demo

[![Inventory Management Application Demo](https://img.youtube.com/vi/5nyNqznCgmU/0.jpg)](https://youtu.be/5nyNqznCgmU "Chatbot Demo")

## Getting Started

### Prerequisites

- Node.js and npm installed
- Firebase account
- Vercel account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/phamandy300/inventory-manager.git
   cd inventory-manager
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   This project uses the following dependencies:
   
   - `@emotion/react`: ^11.13.0
   - `@emotion/styled`: ^11.13.0
   - `@mui/icons-material`: ^5.16.6
   - `@mui/material`: ^5.16.6
   - `@tensorflow-models/coco-ssd`: ^2.2.3
   - `@tensorflow/tfjs`: ^4.20.0
   - `dotenv`: ^16.4.5
   - `firebase`: ^10.12.5
   - `next`: 14.2.5
   - `react`: ^18
   - `react-camera-pro`: ^1.4.0
   - `react-dom`: ^18

3. Set up Firebase:

   - Create a Firebase project and obtain your configuration details.
   - Paste your details into firebase.js

     ```firebase.js
      import { initializeApp } from "firebase/app";
      import { getFirestore } from 'firebase/firestore'
      
      const firebaseConfig = {
        apiKey: your-apiKey,
        authDomain: your-authDomain,
        projectId: your-projectId,
        storageBucket: your-storageBucket,
        messagingSenderId: your-messagingSenderId,
        appId: your-appId,
        measurementId: your-measurementId
      };
      
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      
      export {firestore}
     ```

4. Run the development server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` in your browser to view the application.

### Deployment

1. Push changes to GitHub.
2. Connect your GitHub repository to Vercel.
3. Vercel will handle the deployment automatically with CI/CD.

## Contributing

Feel free to submit pull requests, report issues, or suggest improvements. Contributions are welcome!

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Material UI](https://mui.com/)
- [Firebase](https://firebase.google.com/)
- [Vercel](https://vercel.com/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)

---
