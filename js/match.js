import { db } from './firebase-config.js';
import { collection, getDocs, orderBy, query } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const bracketContainer = document.querySelector('.tournament-bracket');
    if (!bracketContainer) return;

    try {
        // Order matches by the new matchDateTime field
        const matchesSnapshot = await getDocs(query(collection(db, 'matches'), orderBy('matchDateTime')));
        const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (matches.length === 0) {
            bracketContainer.innerHTML = '<p>예정된 경기가 없습니다.</p>';
            return;
        }

        renderMatches(matches, bracketContainer);

    } catch (error) {
        console.error('Error fetching matches: ', error);
        bracketContainer.innerHTML = '<p>대진표를 불러오는 중 오류가 발생했습니다.</p>';
    }
});

function renderMatches(matches, container) {
    container.innerHTML = ''; // Clear existing content

    matches.forEach(match => {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'match';

        const teamsDiv = document.createElement('div');
        teamsDiv.className = 'match-teams';

        const team1Name = document.createElement('span');
        team1Name.className = 'team-name';
        team1Name.textContent = match.team1 || 'TBD';

        const vsSeparator = document.createElement('span');
        vsSeparator.className = 'vs-separator';
        vsSeparator.textContent = 'VS';

        const team2Name = document.createElement('span');
        team2Name.className = 'team-name';
        team2Name.textContent = match.team2 || 'TBD';

        teamsDiv.appendChild(team1Name);
        teamsDiv.appendChild(vsSeparator);
        teamsDiv.appendChild(team2Name);

        const dateTimeDiv = document.createElement('div');
        dateTimeDiv.className = 'match-datetime';
        if (match.matchDateTime) {
            const date = new Date(match.matchDateTime);
            // Format date to be more readable, e.g., "10월 7일 (월) 오후 7:00"
            const options = { month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: true };
            dateTimeDiv.textContent = new Intl.DateTimeFormat('ko-KR', options).format(date);
        } else {
            dateTimeDiv.textContent = '일정 미정';
        }

        matchDiv.appendChild(teamsDiv);
        matchDiv.appendChild(dateTimeDiv);
        container.appendChild(matchDiv);
    });
}