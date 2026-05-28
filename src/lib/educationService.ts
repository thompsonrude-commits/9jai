/**
 * Education Materials Service
 * Provides educational resources, tutorials, and learning materials
 */

export interface EducationMaterial {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  resources: string[];
  duration: number; // in minutes
  tags: string[];
}

export interface CodeExample {
  id: string;
  title: string;
  language: string;
  code: string;
  explanation: string;
  output?: string;
}

// Education materials database
export const EDUCATION_MATERIALS: EducationMaterial[] = [
  {
    id: 'web-basics',
    title: 'Web Development Basics',
    description: 'Learn the fundamentals of HTML, CSS, and JavaScript',
    category: 'Web Development',
    level: 'beginner',
    content: `
# Web Development Basics

## HTML (HyperText Markup Language)
HTML is the standard markup language for creating web pages. It provides the structure and content.

### Basic HTML Structure
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>This is a paragraph.</p>
</body>
</html>
\`\`\`

## CSS (Cascading Style Sheets)
CSS is used to style and layout web pages — for example, to alter the font, color, size, and spacing of your content.

### Basic CSS
\`\`\`css
body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
    margin: 0;
    padding: 20px;
}

h1 {
    color: #333;
    text-align: center;
}
\`\`\`

## JavaScript
JavaScript is a programming language that enables interactive web pages.

### Basic JavaScript
\`\`\`javascript
// Variables
let name = "John";
const age = 30;

// Functions
function greet(name) {
    return "Hello, " + name + "!";
}

// DOM Manipulation
document.getElementById("myButton").addEventListener("click", function() {
    alert("Button clicked!");
});
\`\`\`
    `,
    resources: [
      'https://developer.mozilla.org/en-US/docs/Web/HTML',
      'https://developer.mozilla.org/en-US/docs/Web/CSS',
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    ],
    duration: 120,
    tags: ['html', 'css', 'javascript', 'web', 'beginner'],
  },
  {
    id: 'react-intro',
    title: 'Introduction to React',
    description: 'Learn React fundamentals and component-based architecture',
    category: 'Frontend Framework',
    level: 'intermediate',
    content: `
# Introduction to React

## What is React?
React is a JavaScript library for building user interfaces with reusable components.

## Components
React applications are built using components. There are two types: functional and class components.

### Functional Component
\`\`\`javascript
function Welcome(props) {
    return <h1>Hello, {props.name}</h1>;
}
\`\`\`

### JSX
JSX lets you write HTML-like code in JavaScript.

\`\`\`javascript
const element = <h1>Hello, World!</h1>;
\`\`\`

## State and Props
- **Props**: Read-only data passed from parent to child
- **State**: Data that can change within a component

\`\`\`javascript
import React, { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
}
\`\`\`
    `,
    resources: [
      'https://react.dev',
      'https://react.dev/learn',
    ],
    duration: 180,
    tags: ['react', 'javascript', 'frontend', 'intermediate'],
  },
  {
    id: 'python-basics',
    title: 'Python Programming Basics',
    description: 'Learn Python fundamentals and best practices',
    category: 'Programming',
    level: 'beginner',
    content: `
# Python Programming Basics

## Variables and Data Types
\`\`\`python
# String
name = "John"

# Integer
age = 30

# Float
height = 5.9

# Boolean
is_student = True

# List
fruits = ["apple", "banana", "orange"]

# Dictionary
person = {"name": "John", "age": 30}
\`\`\`

## Control Flow
\`\`\`python
# If statement
if age >= 18:
    print("You are an adult")
else:
    print("You are a minor")

# For loop
for fruit in fruits:
    print(fruit)

# While loop
count = 0
while count < 5:
    print(count)
    count += 1
\`\`\`

## Functions
\`\`\`python
def greet(name):
    return f"Hello, {name}!"

result = greet("Alice")
print(result)
\`\`\`
    `,
    resources: [
      'https://python.org',
      'https://docs.python.org/3/tutorial/',
    ],
    duration: 150,
    tags: ['python', 'programming', 'beginner'],
  },
];

// Code examples database
export const CODE_EXAMPLES: CodeExample[] = [
  {
    id: 'hello-world-js',
    title: 'Hello World in JavaScript',
    language: 'javascript',
    code: `console.log("Hello, World!");`,
    explanation: 'The simplest JavaScript program that prints "Hello, World!" to the console.',
    output: 'Hello, World!',
  },
  {
    id: 'hello-world-python',
    title: 'Hello World in Python',
    language: 'python',
    code: `print("Hello, World!")`,
    explanation: 'The simplest Python program that prints "Hello, World!" to the console.',
    output: 'Hello, World!',
  },
  {
    id: 'fibonacci-js',
    title: 'Fibonacci Sequence in JavaScript',
    language: 'javascript',
    code: `function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 10; i++) {
    console.log(fibonacci(i));
}`,
    explanation: 'Generates the first 10 numbers in the Fibonacci sequence using recursion.',
    output: '0, 1, 1, 2, 3, 5, 8, 13, 21, 34',
  },
];

/**
 * Get all education materials
 */
export function getEducationMaterials(): EducationMaterial[] {
  return EDUCATION_MATERIALS;
}

/**
 * Get materials by category
 */
export function getMaterialsByCategory(category: string): EducationMaterial[] {
  return EDUCATION_MATERIALS.filter(m => m.category === category);
}

/**
 * Get materials by level
 */
export function getMaterialsByLevel(level: 'beginner' | 'intermediate' | 'advanced'): EducationMaterial[] {
  return EDUCATION_MATERIALS.filter(m => m.level === level);
}

/**
 * Search materials
 */
export function searchMaterials(query: string): EducationMaterial[] {
  const lowerQuery = query.toLowerCase();
  return EDUCATION_MATERIALS.filter(m =>
    m.title.toLowerCase().includes(lowerQuery) ||
    m.description.toLowerCase().includes(lowerQuery) ||
    m.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get code examples
 */
export function getCodeExamples(): CodeExample[] {
  return CODE_EXAMPLES;
}

/**
 * Get code examples by language
 */
export function getCodeExamplesByLanguage(language: string): CodeExample[] {
  return CODE_EXAMPLES.filter(ex => ex.language === language);
}

/**
 * Get internet resources for a topic
 */
export function getInternetResources(topic: string): string[] {
  const resources: Record<string, string[]> = {
    'web development': [
      'https://developer.mozilla.org/en-US/docs/Web',
      'https://www.w3schools.com',
      'https://css-tricks.com',
    ],
    'javascript': [
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      'https://javascript.info',
      'https://eloquentjavascript.net',
    ],
    'python': [
      'https://python.org',
      'https://docs.python.org/3',
      'https://realpython.com',
    ],
    'react': [
      'https://react.dev',
      'https://reactjs.org',
      'https://egghead.io/courses/react',
    ],
    'database': [
      'https://www.postgresql.org/docs',
      'https://docs.mongodb.com',
      'https://firebase.google.com/docs',
    ],
  };
  
  const lowerTopic = topic.toLowerCase();
  return resources[lowerTopic] || [];
}

/**
 * Get learning path for a skill
 */
export function getLearningPath(skill: string): EducationMaterial[] {
  const paths: Record<string, string[]> = {
    'web development': ['web-basics', 'react-intro'],
    'python': ['python-basics'],
  };
  
  const materialIds = paths[skill.toLowerCase()] || [];
  return EDUCATION_MATERIALS.filter(m => materialIds.includes(m.id));
}
