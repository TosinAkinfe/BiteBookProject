# BiteBook

A full-stack restaurant discovery and review platform developed as part of a university software engineering group project.

## Overview

BiteBook allows users to discover restaurants, view restaurant information, leave reviews, and interact with restaurant-related content through a web application.

## Tech Stack

- JavaScript / TypeScript
- React
- Node.js
- NoSQL
- Express
- MongoDB AND Mongoose
- Cloudinary
- JWT Authentication

## Contributions 

•	Designed and implemented core Mongoose ODM schemas (User, Review, Bookmark, Restaurant, Notification) with compound indexing to enforce data integrity and optimise query performance.
•	Built a multi-parameter restaurant search and filter system supporting name, cuisine, and minimum rating filters with live average rating calculations that update automatically as reviews are posted or deleted.
•	Implemented email verification system using Nodemailer and cryptographic token hashing (SHA-256) for secure account activation, replacing an initially planned 2FA system after determining it was over-engineered for the use case.
•	Developed cascade deletion logic ensuring referential integrity — when a review is deleted, all associated comments, likes, and notifications are atomically removed and restaurant averages recalculate.
•	Built Cloudinary media pipeline with Multer for image uploads, including server-side auto-cropping of profile pictures to 400x400 pixels, offloading media storage from the database.
•	Created social interaction system with atomic MongoDB array operations for follow/unfollow functionality and notification triggers for follows, likes, and comments.
•	Architected trending feature querying and aggregating the top five most-reviewed restaurants in real-time.
•	Adopted Extreme Programming (XP) methodology with pair programming, weekly supervisor reviews, and GitLab branch-per-feature workflow to coordinate across split frontend/backend teams.


