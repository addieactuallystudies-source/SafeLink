# SafeLink
Unified Personal Safety and Emergency Response Platform | Build Beyond 2026 – HexBloom

🚨 About the Project

SafeLink is a proposed personal safety and emergency response mobile application designed to connect people facing emergencies with trusted contacts and nearby admin-approved community responders.

Through a location-aware SOS system, SafeLink aims to simplify emergency reporting, responder discovery, controlled location sharing, and incident tracking.

🎯 Problem Statement

PS 3.1 – Unified Personal Safety and Emergency Response Platform**

During emergencies, people may struggle to communicate their location, access reliable assistance, or connect with trusted individuals quickly. SafeLink aims to bring these essential steps into one coordinated platform.

💡 Key Features (Planned)

- **Smart SOS:** Activate an emergency request with a selected emergency category.
- **Emergency Categories:** High-risk emergency, medical emergency, personal safety, and other assistance.
- **Trusted Contacts:** Notify selected contacts when an incident is created.
- **Verified Responders:** Admin-reviewed and approved responder registrations.
- **Smart Matching:** Search for available responders within 2 km, expanding up to 5 km when needed.
- **Responder Acceptance:** Assignment is confirmed only after a responder accepts.
- **Private Location Sharing:** Share location only with selected trusted contacts and the assigned responder.
- **Incident Tracking:** View status updates and a chronological incident timeline.
- **Ratings & Feedback:** Allow users to review responders after incident resolution.

🔄 Proposed Workflow

1. User activates SOS and selects an emergency category.
2. The application creates an incident and captures GPS location with permission.
3. Selected trusted contacts are notified.
4. The system searches for eligible responders within 2 km.
5. If no suitable responder is found, the search expands up to 5 km.
6. Eligible responders receive requests and can accept.
7. Location sharing and incident tracking begin for authorized participants.
8. The incident is marked resolved and the user can submit feedback.

🛠️ Proposed Technology Stack

| Technology | Purpose |
|---|---|
| React Native + Expo | Cross-platform mobile application |
| Firebase Authentication | User authentication |
| Cloud Firestore | Application database |
| Firebase Cloud Functions | Secure backend operations and matching |
| React Native Maps | Map integration |
| Browser/device location APIs | Location access |
| GitHub | Version control and collaboration |

 🗺️ Development Roadmap

- [ ] Project setup and repository configuration
- [ ] Mobile application UI
- [ ] User authentication
- [ ] SOS and emergency categories
- [ ] GPS location capture and map
- [ ] Responder registration and admin approval
- [ ] Proximity-based responder matching
- [ ] Responder acceptance and assignment
- [ ] Trusted-contact notifications
- [ ] Incident tracking and status updates
- [ ] Ratings and feedback
- [ ] Testing and demonstration

📊 Current Project Status

Stage: Initial setup

- [x] GitHub repository created
- [x] Team collaboration invitation sent
- [ ] Mobile application development
- [ ] Core functionality implementation
- [ ] Integration and testing

*The prototype has not yet been started. Features listed above are proposed and will be updated as development progresses.*

🔐 Safety & Privacy

SafeLink is being designed with controlled access to sensitive location information, authenticated users, admin-approved responders, and secure incident records.
The hackathon prototype may use demo responders and simulated notifications. It does not claim guaranteed emergency assistance or actual police/ambulance dispatch.
