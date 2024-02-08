import './style.css';
import * as PIXI from 'pixi.js';
import Matter from 'matter-js';

const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1099ff
});
document.body.appendChild(app.view);

const engine = Matter.Engine.create();
const world = engine.world;

const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);

// Create the 3-sided box as a compound body
const boxWidth = 200;
const boxHeight = 100;
const wallThickness = 20;
const box = Matter.Body.create({
    parts: [
        Matter.Bodies.rectangle(0, boxHeight / 2, boxWidth, wallThickness, { isStatic: false }), // bottom
        Matter.Bodies.rectangle(-boxWidth / 2, 0, wallThickness, boxHeight, { isStatic: false }), // left
        Matter.Bodies.rectangle(boxWidth / 2, 0, wallThickness, boxHeight, { isStatic: false }) // right
    ]
});
Matter.Body.setPosition(box, { x: 400, y: 300 }); // Position the center of the compound body

// Suspend the box from a point above it
const suspensionPoint = { x: 400, y: 50 };
const constraint = Matter.Constraint.create({
    pointA: suspensionPoint,
    bodyB: box,
    pointB: { x: 0, y: -boxHeight / 2 },
    stiffness: 0.9,
    length: 250
});

Matter.World.add(world, [box, constraint]);

// Apply an initial force to start the swinging motion
Matter.Body.applyForce(box, { x: box.position.x - boxWidth / 2, y: box.position.y }, { x: -0.05, y: 0 });

const graphics = new PIXI.Graphics();
app.stage.addChild(graphics);

// Add falling objects function
function addFallingObject() {
    const radius = Math.random() * 15 + 5; // Random radius between 5 and 20
    const positionX = Math.random() * 800; // Random position across the canvas width
    const fallingObject = Matter.Bodies.circle(positionX, 0, radius, { restitution: 0.5 });
    Matter.World.add(world, fallingObject);

    setTimeout(addFallingObject, 2000); // Add another object every 2 seconds
}

addFallingObject(); // Start adding falling objects

// Update loop for rendering
app.ticker.add(() => {
    graphics.clear();

    // Transform and draw each part of the compound body
    box.parts.forEach((part, index) => {
        if (index === 0) return; // Skip the compound parent body part

        const vertices = part.vertices;

        graphics.beginFill(0x654321);
        graphics.moveTo(vertices[0].x, vertices[0].y);

        for (let i = 1; i < vertices.length; i++) {
            graphics.lineTo(vertices[i].x, vertices[i].y);
        }

        graphics.closePath();
        graphics.endFill();
    });

    // Draw the suspension point and line
    graphics.lineStyle(2, 0x000000);
    graphics.moveTo(suspensionPoint.x, suspensionPoint.y);
    graphics.lineTo(box.position.x, box.position.y - boxHeight / 2);
    graphics.drawCircle(suspensionPoint.x, suspensionPoint.y, 5);
    graphics.endFill();

    // Draw falling objects
    world.bodies.forEach(body => {
        if (body.circleRadius) { // Check if it's a circle (falling object)
            graphics.beginFill(0xff0000);
            graphics.drawCircle(body.position.x, body.position.y, body.circleRadius);
            graphics.endFill();
        }
    });

    // Update Matter.js engine
    Matter.Engine.update(engine, app.ticker.delta);
});