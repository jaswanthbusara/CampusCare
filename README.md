# Campus Connect

Campus Resource Management and Complaint Resolution System (CRMCRS)

Project Overview

Build a modern, responsive, secure, production-ready full-stack web application called Campus Resource Management and Complaint Resolution System (CRMCRS).

The purpose of this system is to digitize campus maintenance and service requests by allowing students, teachers, staff, maintenance personnel, and administrators to report, track, manage, and resolve issues related to shared campus resources.

Examples of campus resources include:

Fans

Lights

Projectors

Smart Boards

Air Conditioners

Computers

Laboratory Equipment

Benches

Chairs

Desks

WiFi

Water Coolers

Washrooms

Electrical Equipment

Plumbing

Library Resources

Sports Equipment

Campus Infrastructure

Instead of verbally informing someone or writing complaints in registers, users should be able to submit complaints digitally with images, monitor progress, receive notifications, and provide feedback after resolution.

The system should also include additional campus services:

Cleanliness Requests

Lost & Found Management

Campus Announcements

General Service Requests

Resource Inventory

QR Code Based Complaint Registration

Complaint Analytics

Notifications

Feedback & Rating

The application should have a professional, modern design suitable for a Smart Campus Management System.

Design Requirements

Create a premium UI inspired by

Microsoft Fluent Design

Google Material Design

GitHub Dashboard

Notion

Linear.app

Theme

Primary Color

Blue (#2563EB)

Secondary

White

Accent

Light Gray

Background

Very Light Blue

Typography

Inter

Icons

Lucide Icons

Rounded cards

Soft shadows

Glassmorphism where appropriate

Smooth animations

Framer Motion animations

Responsive Design

Desktop

Tablet

Mobile

Dark Mode

Light Mode

Technology Stack

Frontend

Next.js

React

TypeScript

Tailwind CSS

Shadcn UI

React Hook Form

Framer Motion

React Query

Axios

Backend

Node.js

Express.js

JWT Authentication

REST API

Role Based Authentication

File Upload using Multer

Cloudinary Image Storage

Database

MongoDB Atlas

Mongoose

Deployment

Vercel

Render

GitHub

Cloudinary

User Roles

Implement complete Role-Based Authentication.

Roles

1 Student

2 Teacher

3 Maintenance Staff

4 Admin

Each role should have its own dashboard.

Authentication

Features

Registration

Login

Forgot Password

Reset Password

OTP Verification

Email Verification

Google Login

JWT Authentication

Refresh Token

Secure Password Hashing

Remember Me

Role Based Access Control

Landing Page

Create a professional homepage.

Sections

Navigation Bar

Logo

Home

Features

Services

About

Contact

Login

Register

Hero Section

Heading

"Smart Campus Resource Management System"

Subheading

Digitize campus maintenance, complaint resolution, cleanliness services, and lost & found management.

Buttons

Raise Complaint

Get Started

Live Statistics

Show animated counters

Total Resources

Active Users

Complaints Solved

Pending Complaints

Features Section

Complaint Management

Resource Tracking

Lost & Found

Cleanliness

Notifications

Feedback

QR Code Reporting

Testimonials

FAQ

Footer

Contact Information

Quick Links

Social Media

Dashboard

Create beautiful dashboards.

Dashboard Cards

Pending Complaints

Completed Complaints

Active Requests

Resources

Notifications

Recent Activities

Complaint Statistics

Monthly Analytics

Quick Action Buttons

Raise Complaint

Report Lost Item

Request Cleaning

View Resources

Notifications

Charts

Pie Chart

Bar Chart

Line Chart

Area Chart

Heat Map

Complaint Trends

Department Analysis

Priority Analysis

Complaint Management Module

Complaint Form

Fields

Complaint Title

Description

Category

Dropdown

Fan

Light

Projector

Computer

Printer

AC

Desk

Chair

Bench

Lab Equipment

Internet

Electrical

Plumbing

Water Cooler

Washroom

Other

Building

Floor

Room Number

Priority

Low

Medium

High

Critical

Attach Images

Multiple Images

Drag and Drop Upload

Submit Button

Complaint Workflow

Submitted

↓

Admin Review

↓

Assign Technician

↓

Accepted

↓

In Progress

↓

Completed

↓

Feedback

Display status using animated timeline.

Complaint Details Page

Complaint ID

User

Department

Category

Images

Assigned Technician

Remarks

Timeline

Status

Completion Date

Feedback

QR Code Complaint System

Every campus resource should have a unique QR Code.

Examples

Projector

Fan

Computer

Laboratory Equipment

Air Conditioner

Water Cooler

When QR Code is scanned

Open complaint page automatically.

Auto-fill

Building

Room Number

Resource ID

Category

Resource Management Module

Admin should manage

Resource Name

Unique Asset ID

Category

Department

Building

Room

Purchase Date

Warranty

Status

Condition

Last Maintenance

Maintenance History

QR Code

Search Resources

Filter Resources

Edit Resources

Delete Resources

Lost and Found Module

Users can

Report Lost Item

Report Found Item

Upload Images

Search Items

Filter

Category

Date

Location

Status

Mark Returned

Owner Verification

Chat with Finder

Cleanliness Module

Request Types

Dirty Classroom

Dirty Washroom

Dustbin Overflow

Garden Cleaning

Broken Furniture

Water Leakage

Drainage

Broken Window

Upload Images

Track Progress

Assign Cleaning Staff

Completion Photos

Feedback

Maintenance Staff Dashboard

Today's Tasks

Assigned Complaints

Update Status

Upload Repair Images

Repair Notes

Completion Report

Working Hours

Completed Jobs

Performance Score

Admin Dashboard

Manage

Students

Teachers

Staff

Departments

Buildings

Resources

Complaints

Categories

Technicians

Announcements

Lost & Found

Cleanliness Requests

Feedback

Generate Reports

Export PDF

Export Excel

System Analytics

Notification System

Real-time Notifications

Email Notifications

Browser Notifications

In-App Notifications

Notify users when

Complaint Submitted

Complaint Assigned

Complaint Accepted

Complaint Completed

Lost Item Matched

Cleaning Completed

Announcements Published

Announcements Module

Admin creates announcements

Students receive notifications

Categories

General

Exam

Maintenance

Events

Holiday

Emergency

Feedback Module

After complaint completion

5 Star Rating

Review

Technician Rating

Service Rating

Average Dashboard

Search System

Global Search

Complaint ID

User Name

Department

Building

Room Number

Category

Technician

Priority

Status

Filters

Pending

Completed

Critical

Today

This Week

This Month

Department

Building

Category

Priority

Technician

Reports

Generate

Complaint Report

Monthly Report

Department Report

Technician Performance

Resource History

Cleaning Report

Lost & Found Report

Export

PDF

Excel

CSV

Database Collections

Users

Departments

Buildings

Resources

Complaints

Complaint Images

Maintenance Staff

Feedback

Notifications

Announcements

Lost Items

Found Items

Cleaning Requests

Activity Logs

Audit Logs

Security

JWT Authentication

Role Based Authorization

Password Encryption

Input Validation

Rate Limiting

Protected APIs

CSRF Protection

XSS Protection

SQL Injection Prevention

Audit Logs

UI Pages

Landing Page

Login

Register

Forgot Password

Dashboard

Raise Complaint

Complaint Details

Complaint History

Resources

QR Scanner

Lost & Found

Cleanliness

Notifications

Announcements

Feedback

Profile

Settings

Admin Panel

Maintenance Dashboard

Analytics

Reports

Folder Structure

Frontend

/components

/pages

/hooks

/context

/services

/types

/utils

/assets

Backend

/controllers

/routes

/models

/middleware

/services

/utils

/config

/uploads

Database

MongoDB Collections

Proper MVC Architecture

Additional Smart Features

Dark Mode

Light Mode

Progressive Web App (PWA)

Offline Support

Responsive Design

Infinite Scroll

Image Preview

Image Compression

Drag & Drop Upload

Real-Time Dashboard

Socket.IO Notifications

QR Code Generator

QR Code Scanner

AI Complaint Categorization (optional)

Complaint Priority Prediction (optional)

Voice Complaint Submission (optional)

Location-Based Complaint Detection

Google Maps Campus View

Resource Heatmap

Automatic Duplicate Complaint Detection

Technician Availability

Estimated Completion Time

SLA Tracking

Maintenance History Timeline

Preventive Maintenance Scheduler

Sample Data

Generate

50 Students

20 Teachers

10 Maintenance Staff

500 Campus Resources

200 Complaints

50 Cleaning Requests

50 Lost Items

50 Found Items

Announcements

Feedback Records

Final Deliverables

Generate a complete production-ready project including:

Responsive frontend

Professional UI/UX

Backend REST API

MongoDB database

JWT Authentication

Admin Dashboard

Student Dashboard

Teacher Dashboard

Maintenance Dashboard

Complaint Management Module

Resource Inventory Module

QR Code Reporting Module

Lost & Found Module

Cleanliness Management Module

Notification System

Feedback System

Analytics Dashboard

Reports Module

PDF & Excel Export

Role-Based Access Control

Cloudinary Image Upload

Socket.IO Real-Time Updates

Clean folder structure

Production-ready code

README with installation instructions

Environment variables

API documentation

Seed data

Deployment configuration

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/43d7d4d0-f0f9-4c0a-97e8-fa9dcf7eff7e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
