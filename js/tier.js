
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
    const gradesContainer = document.getElementById('grades-container');

    if (!gradesContainer) return;

    try {
        const q = query(collection(db, 'applications'), orderBy('grade', 'asc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            gradesContainer.innerHTML = '<p>아직 등급이 매겨진 신청자가 없습니다.</p>';
            return;
        }

        const applicantsByGrade = {
            '1': [], '2': [], '3': [], '4': [], '5': []
        };

        querySnapshot.forEach(doc => {
            const applicant = doc.data();
            if (applicant.grade && applicantsByGrade[applicant.grade]) {
                applicantsByGrade[applicant.grade].push(applicant);
            }
        });

        gradesContainer.innerHTML = '';

        const gradeIcons = {
            '1': 'looks_one',
            '2': 'looks_two',
            '3': 'looks_3',
            '4': 'looks_4',
            '5': 'looks_5'
        };

        for (const grade in applicantsByGrade) {
            const gradeGroup = document.createElement('div');
            gradeGroup.classList.add('grade-group');

            const title = document.createElement('h2');
            title.classList.add('grade-group-title');

            const icon = document.createElement('span');
            icon.classList.add('material-symbols-outlined');
            icon.textContent = gradeIcons[grade] || 'help';

            const titleText = document.createElement('span');
            titleText.textContent = `${grade}등급`;

            title.appendChild(icon);
            title.appendChild(titleText);
            gradeGroup.appendChild(title);

            const applicantList = document.createElement('div');
            applicantList.classList.add('applicant-list-grid');

            if (applicantsByGrade[grade].length > 0) {
                applicantsByGrade[grade].forEach(applicant => {
                    const card = document.createElement('div');
                    card.classList.add('applicant-item-card');

                    const name = document.createElement('h3');
                    name.textContent = applicant.applicantName;

                    const riotId = document.createElement('p');
                    riotId.textContent = `Riot ID: ${applicant.riotId}`;

                    card.appendChild(name);
                    card.appendChild(riotId);
                    applicantList.appendChild(card);
                });
            } else {
                const noApplicant = document.createElement('p');
                noApplicant.textContent = '해당 등급의 신청자가 없습니다.';
                applicantList.appendChild(noApplicant);
            }

            gradeGroup.appendChild(applicantList);
            gradesContainer.appendChild(gradeGroup);
        }

        const searchBar = document.getElementById('search-bar');
        const searchButton = document.getElementById('search-button');
        const noResultsMessage = document.getElementById('no-results-message');

        const performSearch = () => {
            const searchTerm = searchBar.value.toLowerCase();
            const gradeGroups = document.querySelectorAll('.grade-group');
            let totalVisibleApplicants = 0;
            let animationDelay = 0;

            gradeGroups.forEach(group => {
                const applicantCards = group.querySelectorAll('.applicant-item-card');
                let visibleApplicantsInGroup = 0;

                applicantCards.forEach(card => {
                    card.classList.remove('fade-in');
                    const name = card.querySelector('h3').textContent.toLowerCase();
                    const riotId = card.querySelector('p').textContent.toLowerCase();

                    if (name.includes(searchTerm) || riotId.includes(searchTerm)) {
                        card.style.display = 'block';
                        card.style.animationDelay = `${animationDelay * 0.05}s`;
                        card.classList.add('fade-in');
                        visibleApplicantsInGroup++;
                        animationDelay++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                if (visibleApplicantsInGroup > 0) {
                    group.style.display = 'block';
                    totalVisibleApplicants += visibleApplicantsInGroup;
                } else {
                    group.style.display = 'none';
                }
            });

            if (totalVisibleApplicants === 0) {
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
        console.error('Error fetching graded applicants: ', error);
        gradesContainer.innerHTML = '<p>등급 정보를 불러오는 중 오류가 발생했습니다.</p>';
    }
});
