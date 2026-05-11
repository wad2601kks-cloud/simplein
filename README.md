# Simplein 🛒
> **"Apa yang lu butuhin? Biar seller nyari lu."**

Simplein is a web-based e-commerce platform featuring a **Reverse Marketplace** concept that places buyers at the center of the shopping experience. Unlike conventional platforms where buyers search for products, Simplein reverses the process: buyers simply broadcast their needs, and sellers actively find and offer products to them.

---

## 🌟 Key Features

* **Buyer Request Broadcast:** Buyers type their needs in natural language and broadcast them to all active sellers.
* **Reverse Marketplace / Tender System:** Implements a competitive bidding process where multiple sellers respond to a single buyer request.
* **Real-Time Synchronization:** Uses Firebase Firestore `onSnapshot` to ensure offers, chat messages, and status updates are reflected instantly.
* **Interactive Map Integration:** Features a Leaflet.js and OpenStreetMap integration for accurate shipping location selection.
* **Real-Time Post-Transaction Chat:** Direct communication channel between buyers and sellers once a checkout is completed.
* **5-Stage Shipping Tracking:** Comprehensive tracking system: Pending, Processed, Shipped, Delivered, and Completed.
* **Rating & Review System:** Buyers can provide star ratings and text reviews for sellers after order completion.

---

## 🛠️ Technical Architecture & Tech Stack

Simplein is built as a static web application with a frontend-heavy architecture utilizing cloud services.

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Tailwind CSS, JavaScript (ES Modules) |
| **Backend / Database** | Firebase Firestore (NoSQL Realtime Database) |
| **Authentication** | Firebase Authentication (Email & Password) |
| **Maps & Geolocation** | Leaflet.js + OpenStreetMap (Nominatim API) |
| **AI Integration** | Google Generative AI (@google/generative-ai) |
| **UI & Icons** | Lucide Icons, Google Fonts (Inter) |

---

## 🔄 Workflow

### 🙋‍♂️ Buyer Flow
1. **Request:** Type needs in natural language and press the "Broadcast" button.
2. **Compare:** Monitor real-time offers displayed as product cards.
3. **Checkout:** Select the best offer, set shipping location via map, and upload payment proof.
4. **Complete:** Chat with the seller, track shipping, and confirm receipt to leave a review.

### 👨‍💼 Seller Flow
1. **Access:** Log in or register via the seller dashboard protected by Firebase Auth.
2. **Respond:** View active buyer broadcasts in real-time and submit product offers.
3. **Manage:** Verify payment proofs, chat with buyers, and update shipping statuses.

---

## 👥 Development Team (Group KKS)
Developed for the **Web Application Development (WAD25)** course by:
* **Kaila Neva Sidni** (001202500071)
* **Kyooshi Kirei Santoso** (001202500060)
* **Silvia Salsabila** (001202500225)

---
*Philosophy: The Buyer is King. The market should come to you.*
