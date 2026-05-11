# Simplein 🛒
> [cite_start]**"What do you need? Let the seller find you."** [cite: 10]

[cite_start]**Simplein** is a web-based e-commerce platform featuring a **Reverse Marketplace** concept that places buyers at the center of the shopping experience[cite: 8]. [cite_start]Unlike conventional platforms where buyers search for products, Simplein reverses the process: buyers simply broadcast their needs, and sellers actively find and offer products to them[cite: 9].

---

## 🌟 Key Features

* [cite_start]**Buyer Request Broadcast:** Buyers type their needs in natural language and broadcast them to all active sellers[cite: 41, 42].
* [cite_start]**Reverse Marketplace / Tender System:** Implements a competitive bidding process where multiple sellers respond to a single buyer request[cite: 14, 75].
* [cite_start]**Real-Time Synchronization:** Uses Firebase Firestore `onSnapshot` to ensure offers, chat messages, and status updates are reflected instantly without page reloads[cite: 34, 109].
* [cite_start]**Interactive Map Integration:** Features a Leaflet.js and OpenStreetMap integration for accurate shipping location selection during checkout[cite: 37, 57].
* [cite_start]**Real-Time Post-Transaction Chat:** Direct communication channel between buyers and sellers once a checkout is completed[cite: 18, 60].
* [cite_start]**5-Stage Shipping Tracking:** Comprehensive tracking system through five stages: Pending, Processed, Shipped, Delivered, and Completed[cite: 62, 80].
* [cite_start]**Rating & Review System:** Buyers can provide star ratings (1-5) and text reviews for sellers after order completion[cite: 70, 80].

---

## 🛠️ Technical Architecture & Tech Stack

[cite_start]Simplein is built as a static web application with a frontend-heavy architecture utilizing cloud services for backend and database needs[cite: 27].

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [cite_start]HTML5, CSS3, Tailwind CSS, JavaScript (ES Modules) [cite: 28] |
| **Backend / Database** | [cite_start]Firebase Firestore (NoSQL Realtime Database) [cite: 28, 33] |
| **Authentication** | [cite_start]Firebase Authentication (Email & Password) [cite: 28, 35] |
| **Maps & Geolocation** | [cite_start]Leaflet.js + OpenStreetMap (Nominatim API) [cite: 28, 37] |
| **AI Integration** | [cite_start]Google Generative AI (@google/generative-ai) [cite: 28, 38] |
| **UI & Icons** | [cite_start]Lucide Icons, Google Fonts (Inter) [cite: 28] |

---

## 🔄 Workflow

### 🙋‍♂️ Buyer Flow
1. [cite_start]**Request:** Type needs in natural language and press the "Broadcast" button[cite: 87, 88].
2. [cite_start]**Compare:** Monitor real-time offers displayed as product cards[cite: 89, 90].
3. [cite_start]**Checkout:** Select the best offer, set shipping location via map, and upload payment proof[cite: 91, 92].
4. [cite_start]**Complete:** Chat with the seller, track shipping, and confirm receipt to leave a review[cite: 93, 94, 95].

### 👨‍💼 Seller Flow
1. [cite_start]**Access:** Log in or register via the seller dashboard protected by Firebase Auth[cite: 97].
2. [cite_start]**Respond:** View active buyer broadcasts in real-time and submit product offers[cite: 98, 100].
3. [cite_start]**Manage:** Verify payment proofs, chat with buyers, and update shipping statuses until completion[cite: 104, 105].

---

## 👥 Development Team (Group KKS)
[cite_start]Developed for the **Web Application Development (WAD25)** course [cite: 3] by:
* [cite_start]**Kaila Neva Sidni** (001202500071) [cite: 5]
* [cite_start]**Kyooshi Kirei Santoso** (001202500060) [cite: 6]
* [cite_start]**Silvia Salsabila** (001202500225) [cite: 6]

---
*Philosophy: The Buyer is King. The market should come to you.* [cite: 20, 21]
