
const firebaseConfig = {
    apiKey: "",
    authDomain: "varchasvaleaderboard.firebaseapp.com",
    projectId: "varchasvaleaderboard",
    storageBucket: "varchasvaleaderboard.firebasestorage.app",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
  };
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization failed:", error);
}
const db = firebase.firestore();

// Data storage
let leaderboards = { main: [], enthu: [] };
let events = [];

// DOM elements
const leaderboardSection = document.getElementById('leaderboard-section');
const eventsSection = document.getElementById('events-section');
const leaderboardDisplay = document.getElementById('leaderboard-display');
const leaderboardTitle = document.getElementById('leaderboard-title');
const leaderboardBody = document.getElementById('leaderboard-body');
const eventsList = document.getElementById('events-list');
const leaderboardOption = document.getElementById('leaderboard-option');
const eventsOption = document.getElementById('events-option');
const mainBtn = document.getElementById('main-btn');
const enthuBtn = document.getElementById('enthu-btn');

// Show leaderboard section
function showLeaderboardSection() {
    leaderboardSection.style.display = 'block';
    eventsSection.style.display = 'none';
    leaderboardDisplay.style.display = 'none';
}

// Show specific leaderboard
function showLeaderboard(type) {
    leaderboardDisplay.style.display = 'block';
    leaderboardTitle.textContent = type === 'main' ? 'Main Leaderboard' : 'Enthu Leaderboard';
    const data = leaderboards[type].sort((a, b) => b.points - a.points);
    leaderboardBody.innerHTML = '';
    data.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Rank">${index + 1}</td>
            <td data-label="Department">${entry.name}</td>
            <td data-label="Points">${entry.points}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

// Show events section
function showEventsSection() {
    leaderboardSection.style.display = 'none';
    eventsSection.style.display = 'block';
    eventsList.innerHTML = '';
    events.forEach(event => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${event.name} - ${event.date}<br>
            1st: ${event.results.first} (${event.results.points.first} pts)<br>
            2nd: ${event.results.second} (${event.results.points.second} pts)<br>
            3rd: ${event.results.third} (${event.results.points.third} pts)
        `;
        eventsList.appendChild(li);
    });
}

// Real-time listeners
db.collection('leaderboards').doc('main').collection('departments').onSnapshot(snapshot => {
    leaderboards.main = [];
    snapshot.forEach(doc => leaderboards.main.push({ name: doc.id, points: doc.data().points || 0 }));
    if (leaderboardTitle.textContent === 'Main Leaderboard' && leaderboardDisplay.style.display === 'block') {
        showLeaderboard('main');
    }
}, error => console.error("Error fetching Main leaderboard:", error));

db.collection('leaderboards').doc('enthu').collection('departments').onSnapshot(snapshot => {
    leaderboards.enthu = [];
    snapshot.forEach(doc => leaderboards.enthu.push({ name: doc.id, points: doc.data().points || 0 }));
    if (leaderboardTitle.textContent === 'Enthu Leaderboard' && leaderboardDisplay.style.display === 'block') {
        showLeaderboard('enthu');
    }
}, error => console.error("Error fetching Enthu leaderboard:", error));

db.collection('events').onSnapshot(snapshot => {
    events = [];
    snapshot.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
    if (eventsSection.style.display === 'block') {
        showEventsSection();
    }
}, error => console.error("Error fetching events:", error));

// Button events
leaderboardOption.addEventListener('click', showLeaderboardSection);
eventsOption.addEventListener('click', showEventsSection);
mainBtn.addEventListener('click', () => showLeaderboard('main'));
enthuBtn.addEventListener('click', () => showLeaderboard('enthu'));

// Initial load
showLeaderboardSection();
