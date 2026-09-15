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

## My Contributions 

As part of the development team, I worked primarily on backend functionality, database design, data integrity, search functionality, and social features.

### Database Design & Performance

* Designed and implemented core Mongoose ODM schemas for **User, Review, Bookmark, Restaurant, and Notification**.
* Implemented compound indexes to improve query performance and support data integrity.
* Designed processes to maintain consistency across related data as users interacted with the application.

### Restaurant Search & Ratings

* Built a multi-parameter restaurant search and filtering system supporting **restaurant name, cuisine, and minimum rating**.
* Implemented live average rating calculations that automatically update when reviews are posted or deleted.
* Developed the trending restaurant feature, querying and aggregating the **five most-reviewed restaurants**.

### Authentication & Email Verification

* Implemented an email verification system using **Nodemailer**.
* Used **SHA-256 cryptographic hashing** for verification tokens to improve security.
* Replaced an initially planned 2FA approach after determining that email verification was more appropriate for the project's requirements.

### Data Integrity

* Developed cascade deletion logic to maintain referential integrity.
* When a review is deleted, associated comments, likes, and notifications are removed, while the restaurant's average rating is recalculated.
* Used atomic MongoDB operations for operations involving related social data.

### Social Features

* Implemented follow/unfollow functionality using MongoDB array operations.
* Built notification triggers for follows, likes, and comments.

### Media Handling

* Built a Cloudinary media pipeline using **Multer** for image uploads.
* Implemented server-side profile picture processing, including automatic cropping to **400×400 pixels**.
* Offloaded media storage from MongoDB to Cloudinary.

## Development Practices

The project followed **Extreme Programming (XP)** practices, including:

* Pair programming
* Weekly supervisor reviews
* GitLab branch-per-feature workflow
* Collaboration across separate frontend and backend teams
* Regular integration and testing

