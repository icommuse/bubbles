# Bubbles

Bubbles is a camera-based interactive web experience made for children, with special consideration for those who cannot easily leave their hospital rooms.

The project uses hand, face, and pose-style interactions to create playful glass-like bubbles on screen. Children can open their hand, open their mouth, or touch floating bubbles through the camera view, turning small body movements into a gentle visual game.

## Quick Access

You can open Bubbles directly at <https://icommuse.github.io/bubbles[https://icommuse.github.io/bubbles]>.

Bubbles works with the camera on a PC, smartphone, or tablet. It can be enjoyed on the device screen, and it may feel even more playful when the screen is shown large with a projector so the bubbles can fill a room or shared space.

## Purpose

This project was created with hospitalized children in mind, while also being designed for any child who might enjoy a gentle, camera-based play experience.

The goal is to make something light, accessible, and playful that can be enjoyed from a bed, a small room, a classroom, or at home. Instead of requiring controllers or large movements, the experience responds to simple gestures through a webcam.

## Hope for Reuse

You are welcome to copy, adapt, and share this project. If you do, we hope it helps bring gentle, accessible play experiences to children, especially children in hospitals, care settings, or other places where leaving the room is difficult.

This is a request and project value, not an added license restriction.

## Features

- Hand interaction: bubbles appear from the fingertips one by one.
- Mouth interaction: bubbles are released when the mouth opens.
- Bubble physics: bubbles can move and collide with detected fingertips.
- Glass/refraction-style bubble rendering.
- Adjustable bubble size, fall speed, and density.
- Auto-hiding controls and bottom tabs for a cleaner screen.

## Main Files

- `index.html` - Main interactive experience.
- `glassBall.js` - Glass/refraction bubble rendering.
- `0.html`, `1.html`, `2.html` - Individual experiment pages.

## License

The original code in this repository is licensed under the Apache License 2.0. See `LICENSE`.

This project loads third-party libraries from public CDNs. Those libraries are licensed separately by their respective authors. See `THIRD_PARTY_NOTICES.md` for details.
