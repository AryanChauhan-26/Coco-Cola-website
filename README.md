# Coca-Cola 3D Scrolling Experience
 
An immersive, fully 3D scroll-driven website inspired by the Coca-Cola brand — as the user scrolls, a 3D bottle/scene animates through a sequence of camera moves, transformations, and visual storytelling beats instead of a traditional page layout.
 
> **Note:** This README is a starter template. Update the sections below (Tech Stack, Setup, Structure) to match your actual project once you share more details — I can regenerate it to match your exact stack/folder layout.
 
## ✨ Features
 
- **Scroll-driven 3D animation** — camera and object transforms are tied to scroll position, not click events
- **3D bottle/can model** with realistic materials, lighting, and reflections
- **Section-based storytelling** — each scroll segment reveals a new stage (e.g. brand intro, product reveal, ingredients, lifestyle, call-to-action)
- **Smooth scroll & easing** for a cinematic feel
- **Responsive design** — adapts scene scale and camera framing across desktop, tablet, and mobile
 
## 📁 Project Structure
 
```
coca-cola-3d-website/
├── public/
│   └── models/           # 3D assets (.glb, .gltf, textures)
├── src/
│   ├── components/       # Reusable UI & 3D components
│   ├── scenes/           # Three.js scene setup, camera, lighting
│   ├── animations/       # GSAP ScrollTrigger timelines
│   ├── assets/           # Images, fonts, icons
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── README.md
```
 
 
## 🎮 How the Scroll Experience Works
 
1. The page height is extended (or a virtual scroll container is used) to create scroll "distance."
2. Scroll position is mapped to a timeline (GSAP ScrollTrigger) that drives:
   - Camera position/rotation
   - 3D model transforms (rotation, scale, position)
   - Lighting and material changes
   - UI text/element reveals

## 🤝 Contributing
 
Contributions, issues, and feature requests are welcome. 
## 📄 License
This project is for educational/portfolio purposes. Coca-Cola® is a registered trademark of The Coca-Cola Company; this project is not affiliated with or endorsed by them.
