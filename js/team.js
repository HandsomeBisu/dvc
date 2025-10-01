
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const teamsContainer = document.getElementById('teams-container');

    if (!teamsContainer) return;

    try {
        const q = query(collection(db, 'teams'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            teamsContainer.innerHTML = '<p>아직 생성된 팀이 없습니다.</p>';
            return;
        }

        teamsContainer.innerHTML = '';

        for (const doc of querySnapshot.docs) {
            const team = doc.data();
            const teamGroup = document.createElement('div');
            teamGroup.classList.add('team-group');

            const title = document.createElement('h2');
            title.classList.add('team-group-title');

            const icon = document.createElement('span');
            icon.classList.add('material-symbols-outlined');
            icon.textContent = 'groups';

            const titleText = document.createElement('span');
            titleText.textContent = team.name;

            title.appendChild(icon);
            title.appendChild(titleText);
            teamGroup.appendChild(title);

            const memberList = document.createElement('div');
            memberList.classList.add('team-member-list-grid');

            if (team.members && team.members.length > 0) {
                team.members.forEach(member => {
                    const card = document.createElement('div');
                    card.classList.add('team-member-item-card');

                    const name = document.createElement('h3');
                    name.textContent = member.name;

                    const riotId = document.createElement('p');
                    riotId.textContent = `Riot ID: ${member.riotId}`;

                    card.appendChild(name);
                    card.appendChild(riotId);
                    memberList.appendChild(card);
                });
            } else {
                const noMember = document.createElement('p');
                noMember.textContent = '해당 팀에 팀원이 없습니다.';
                memberList.appendChild(noMember);
            }

            teamGroup.appendChild(memberList);
            teamsContainer.appendChild(teamGroup);
        }

        const searchBar = document.getElementById('search-bar');
        const searchButton = document.getElementById('search-button');
        const noResultsMessage = document.getElementById('no-results-message');

        const performSearch = () => {
            const searchTerm = searchBar.value.toLowerCase();
            const teamGroups = document.querySelectorAll('.team-group');
            let totalVisibleTeams = 0;
            let animationDelay = 0;

            teamGroups.forEach(group => {
                const teamName = group.querySelector('h2').textContent.toLowerCase();
                const memberCards = group.querySelectorAll('.team-member-item-card');
                let visibleMembersInGroup = 0;

                memberCards.forEach(card => {
                    card.classList.remove('fade-in');
                    const memberName = card.querySelector('h3').textContent.toLowerCase();
                    const riotId = card.querySelector('p').textContent.toLowerCase();

                    if (memberName.includes(searchTerm) || riotId.includes(searchTerm)) {
                        card.style.display = 'block';
                        card.style.animationDelay = `${animationDelay * 0.05}s`;
                        card.classList.add('fade-in');
                        visibleMembersInGroup++;
                        animationDelay++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                if (teamName.includes(searchTerm) || visibleMembersInGroup > 0) {
                    group.style.display = 'block';
                    totalVisibleTeams++;
                    // If searching for team name, show all members
                    if (teamName.includes(searchTerm) && visibleMembersInGroup === 0) {
                        memberCards.forEach(card => {
                            card.style.display = 'block';
                        });
                    }
                } else {
                    group.style.display = 'none';
                }
            });

            if (totalVisibleTeams === 0) {
                noResultsMessage.style.display = 'block';
            } else {
                noResultsMessage.style.display = 'none';
            }
        };

        searchButton.addEventListener('click', performSearch);

        searchBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

    } catch (error) {
        console.error('Error fetching teams: ', error);
        teamsContainer.innerHTML = '<p>팀 정보를 불러오는 중 오류가 발생했습니다.</p>';
    }
});
