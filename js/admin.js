import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    // Modal elements
    const modal = document.getElementById('custom-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalSpinner = document.getElementById('modal-spinner');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Function to show the modal
    const showModal = (message, isLoading = false) => {
        if (!modal) return;
        modalMessage.textContent = message;
        if (isLoading) {
            modalSpinner.style.display = 'block';
            modalMessage.style.display = 'none';
            modalCloseBtn.style.display = 'none';
        } else {
            modalSpinner.style.display = 'none';
            modalMessage.style.display = 'block';
            modalCloseBtn.style.display = 'block';
        }
        modal.classList.add('visible');
    };

    // Function to hide the modal
    const hideModal = () => {
        if (!modal) return;
        modal.classList.remove('visible');
    };

    if (modal) {
        modalCloseBtn.addEventListener('click', hideModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });
    }

    // Tab switching logic
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (tab.hasAttribute('href')) {
                return; // Let the browser handle the navigation
            }

            e.preventDefault();

            const target = document.getElementById(tab.dataset.tab);

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            tabContents.forEach(c => c.style.display = 'none');
            if (target) {
                target.style.display = 'block';
                if (tab.dataset.tab === 'terms') {
                    loadTermsData();
                } else if (tab.dataset.tab === 'teams') {
                    loadTeams();
                }
            }
        });
    });

    // Load applicant list
    const applicantListBody = document.getElementById('applicant-list');
    const statsContainer = document.getElementById('stats-container');

    const createPieChart = (chartId, labels, data) => {
        const canvas = document.getElementById(chartId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (canvas.chart) {
            canvas.chart.destroy();
        }

        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                        '#E7E9ED', '#839192', '#C39BD3', '#F7DC6F', '#76D7C4', '#85C1E9'
                    ],
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#ffffff'
                        }
                    },
                }
            }
        });

        canvas.chart = chart;
    };

    const updateStatistics = (applicants) => {
        const totalApplicants = applicants.length;
        document.getElementById('total-applicants').textContent = totalApplicants;

        const classCounts = applicants.reduce((acc, app) => {
            const className = app.class ? `${app.class}반` : '미지정';
            acc[className] = (acc[className] || 0) + 1;
            return acc;
        }, {});

        const currentTierCounts = applicants.reduce((acc, app) => {
            const tier = app.currentTier || '미지정';
            acc[tier] = (acc[tier] || 0) + 1;
            return acc;
        }, {});

        const peakTierCounts = applicants.reduce((acc, app) => {
            const tier = app.peakTier || '미지정';
            acc[tier] = (acc[tier] || 0) + 1;
            return acc;
        }, {});

        if (document.getElementById('class-chart')) {
            createPieChart('class-chart', Object.keys(classCounts), Object.values(classCounts));
        }
        if (document.getElementById('current-tier-chart')) {
            createPieChart('current-tier-chart', Object.keys(currentTierCounts), Object.values(currentTierCounts));
        }
        if (document.getElementById('peak-tier-chart')) {
            createPieChart('peak-tier-chart', Object.keys(peakTierCounts), Object.values(peakTierCounts));
        }
    };

    const loadApplicants = async () => {
        if (!applicantListBody) return;
        applicantListBody.innerHTML = '<tr><td colspan="9">불러오는 중...</td></tr>';
        if (statsContainer) statsContainer.style.display = 'none';

        try {
            const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                applicantListBody.innerHTML = '<tr><td colspan="9">신청자가 없습니다.</td></tr>';
                if (statsContainer) statsContainer.style.display = 'none';
                return;
            }

            if (statsContainer) statsContainer.style.display = 'grid';
            applicantListBody.innerHTML = '';

            const applicants = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                applicants.push(data);

                const newRow = applicantListBody.insertRow();
                newRow.dataset.id = data.id;

                const date = data.createdAt.toDate();
                const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                const gradeSelect = document.createElement('select');
                gradeSelect.classList.add('grade-select');
                for (let i = 1; i <= 5; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = `${i}등급`;
                    if (data.grade == i) {
                        option.selected = true;
                    }
                    gradeSelect.appendChild(option);
                }

                gradeSelect.addEventListener('change', (e) => {
                    updateApplicantGrade(data.id, e.target.value);
                });

                newRow.innerHTML = `
                    <td>${data.applicantName || ''}</td>
                    <td>${data.contact || ''}</td>
                    <td>${data.class ? data.class + '반' : ''}</td>
                    <td>${data.riotId || ''}</td>
                    <td>${data.currentTier || ''}</td>
                    <td>${data.peakTier || ''}</td>
                    <td>${formattedDate}</td>
                    <td></td>
                    <td>${data.status || 'pending'}</td>
                `;
                newRow.cells[7].appendChild(gradeSelect);
            });

            updateStatistics(applicants);

        } catch (error) {
            console.error("Error fetching documents: ", error);
            applicantListBody.innerHTML = '<tr><td colspan="9">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>';
            if (statsContainer) statsContainer.style.display = 'none';
        }
    };

    const updateApplicantGrade = async (id, grade) => {
        showModal('등급 업데이트 중...', true);
        try {
            const applicantRef = doc(db, 'applications', id);
            await setDoc(applicantRef, { grade: parseInt(grade, 10) }, { merge: true });
            showModal('등급이 성공적으로 업데이트되었습니다.');
        } catch (error) {
            console.error('Error updating grade: ', error);
            showModal('등급 업데이트 중 오류가 발생했습니다.');
        }
    };

    const deleteApplicant = async (id) => {
        showModal('삭제 중...', true);
        try {
            await deleteDoc(doc(db, "applications", id));
            showModal('성공적으로 삭제되었습니다.');
            loadApplicants(); // Refresh the list
        } catch (error) {
            console.error("Error deleting document: ", error);
            showModal('삭제 중 오류가 발생했습니다.');
        }
    };

    // Terms management logic
    const termsForm = document.getElementById('terms-form');
    const termsRef = doc(db, "agreements", "content");

    const loadTermsData = async () => {
        try {
            const docSnap = await getDoc(termsRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('terms-check').value = data.check || '';
                document.getElementById('terms-conditions').value = data.conditions || '';
                document.getElementById('terms-coc').value = data.coc || '';
                document.getElementById('terms-privacy').value = data.privacy || '';
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error loading terms: ", error);
            showModal('약관 정보를 불러오는 데 실패했습니다.');
        }
    };

    if (termsForm) {
        termsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showModal('저장 중...', true);

            try {
                const data = {
                    check: document.getElementById('terms-check').value,
                    conditions: document.getElementById('terms-conditions').value,
                    coc: document.getElementById('terms-coc').value,
                    privacy: document.getElementById('terms-privacy').value,
                };
                await setDoc(termsRef, data, { merge: true });
                showModal('성공적으로 저장되었습니다.');
            } catch (error) {
                console.error("Error saving terms: ", error);
                showModal('저장 중 오류가 발생했습니다.');
            }
        });
    }

    // Team management logic
    const manualTeamForm = document.getElementById('manual-team-form');
    const teamMembersList = document.getElementById('team-members-list');
    const autoFormTeamsBtn = document.getElementById('auto-form-teams-btn');
    const teamListsContainer = document.getElementById('team-lists-container');

    const loadAvailableApplicants = async () => {
        if (!teamMembersList) return;
        teamMembersList.innerHTML = '<p>불러오는 중...</p>';

        try {
            const q = query(collection(db, "applications"));
            const querySnapshot = await getDocs(q);
            const applicants = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                if (data.grade && !data.team) { // Graded but not in a team
                    applicants.push(data);
                }
            });

            teamMembersList.innerHTML = '';
            if (applicants.length === 0) {
                teamMembersList.innerHTML = '<p>팀에 추가할 수 있는 신청자가 없습니다.</p>';
                return;
            }

            applicants.forEach(applicant => {
                const item = document.createElement('div');
                item.classList.add('applicant-checkbox-item');
                item.innerHTML = `
                    <input type="checkbox" id="${applicant.id}" value='${JSON.stringify(applicant)}'>
                    <label for="${applicant.id}">${applicant.applicantName} (${applicant.grade}등급)</label>
                `;
                teamMembersList.appendChild(item);
            });

        } catch (error) {
            console.error("Error fetching available applicants: ", error);
            teamMembersList.innerHTML = '<p>신청자 정보를 불러오는 중 오류가 발생했습니다.</p>';
        }
    };

    const loadTeams = async () => {
        if (!teamListsContainer) return;
        teamListsContainer.innerHTML = '<p>팀 목록을 불러오는 중...</p>';
        loadAvailableApplicants(); // Load available applicants for the form

        try {
            const q = query(collection(db, "teams"), orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                teamListsContainer.innerHTML = '<p>생성된 팀이 없습니다.</p>';
                return;
            }

            teamListsContainer.innerHTML = '';
            querySnapshot.forEach(doc => {
                const team = doc.data();
                const teamElement = document.createElement('div');
                teamElement.classList.add('team-group');
                let membersHtml = team.members.map(m => `<li>${m.name} (${m.riotId}) - ${m.grade}등급</li>`).join('');
                teamElement.innerHTML = `
                    <div class="team-group-header">
                        <h3 class="team-group-title">${team.name}</h3>
                        <button class="btn btn-small btn-danger delete-team-btn" data-team-name="${team.name}">삭제</button>
                    </div>
                    <ul>${membersHtml}</ul>
                `;
                teamListsContainer.appendChild(teamElement);
            });

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-team-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const teamName = e.target.dataset.teamName;
                    if (confirm(`'${teamName}' 팀을 정말로 삭제하시겠습니까? 팀에 속한 모든 팀원들이 팀 없는 상태로 변경됩니다.`)) {
                        deleteTeam(teamName);
                    }
                });
            });

        } catch (error) {
            console.error("Error fetching teams: ", error);
            teamListsContainer.innerHTML = '<p>팀 목록을 불러오는 중 오류가 발생했습니다.</p>';
        }
    };

    const deleteTeam = async (teamName) => {
        showModal('팀 삭제 중...', true);
        try {
            // Delete the team document
            await deleteDoc(doc(db, "teams", teamName));

            // Find all applicants in that team and update their status
            const q = query(collection(db, "applications"));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (document) => {
                const data = document.data();
                if (data.team === teamName) {
                    const applicantRef = doc(db, "applications", document.id);
                    await setDoc(applicantRef, { team: null }, { merge: true });
                }
            });

            showModal('팀이 성공적으로 삭제되었습니다.');
            loadTeams(); // Refresh the lists

        } catch (error) {
            console.error("Error deleting team: ", error);
            showModal('팀 삭제 중 오류가 발생했습니다.');
        }
    };

    const autoFormTeams = async () => {
        showModal('팀 구성 중...', true);

        try {
            const q = query(collection(db, "applications"));
            const querySnapshot = await getDocs(q);
            const applicants = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                if (data.grade && !data.team) { // Consider only graded applicants not in a team
                    applicants.push(data);
                }
            });

            if (applicants.length < 5) {
                showModal('팀을 구성하기에 신청자 수가 부족합니다.');
                return;
            }

            // Shuffle applicants to ensure randomness
            for (let i = applicants.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [applicants[i], applicants[j]] = [applicants[j], applicants[i]];
            }

            const teams = [];
            let teamIndex = 1;
            while (applicants.length >= 5) {
                const teamMembers = applicants.splice(0, 5);
                const teamName = `팀 ${teamIndex}`;
                const teamData = {
                    name: teamName,
                    members: teamMembers.map(m => ({
                        id: m.id, // Keep track of id for updating status
                        name: m.applicantName,
                        riotId: m.riotId,
                        grade: m.grade
                    }))
                };
                teams.push(teamData);
                teamIndex++;
            }

            // Save teams to Firestore and update applicant statuses
            for (const team of teams) {
                const teamRef = doc(db, 'teams', team.name);
                // Don't save member id to team document
                const membersForTeamDoc = team.members.map(({ id, ...rest }) => rest);
                await setDoc(teamRef, { name: team.name, members: membersForTeamDoc });

                for (const member of team.members) {
                    const applicantRef = doc(db, 'applications', member.id);
                    await setDoc(applicantRef, { team: team.name }, { merge: true });
                }
            }

            showModal(`${teams.length}개의 팀이 성공적으로 구성되었습니다.`);
            loadTeams(); // Refresh the team list

        } catch (error) {
            console.error("Error forming teams: ", error);
            showModal('팀 구성 중 오류가 발생했습니다.');
        }
    };

    if (autoFormTeamsBtn) {
        autoFormTeamsBtn.addEventListener('click', autoFormTeams);
    }

    if (manualTeamForm) {
        manualTeamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const teamNameInput = document.getElementById('team-name');
            const teamName = teamNameInput.value.trim();
            if (!teamName) {
                showModal('팀 이름을 입력해주세요.');
                return;
            }

            const selectedCheckboxes = teamMembersList.querySelectorAll('input[type="checkbox"]:checked');
            if (selectedCheckboxes.length !== 5) {
                showModal('팀원은 반드시 5명을 선택해야 합니다.');
                return;
            }

            showModal('팀 생성 중...', true);

            const teamMembers = [];
            selectedCheckboxes.forEach(checkbox => {
                teamMembers.push(JSON.parse(checkbox.value));
            });

            const teamData = {
                name: teamName,
                members: teamMembers.map(m => ({
                    name: m.applicantName,
                    riotId: m.riotId,
                    grade: m.grade
                }))
            };

            try {
                // Save team to Firestore
                const teamRef = doc(db, 'teams', teamName);
                await setDoc(teamRef, teamData);

                // Update applicant statuses
                for (const member of teamMembers) {
                    const applicantRef = doc(db, 'applications', member.id);
                    await setDoc(applicantRef, { team: teamName }, { merge: true });
                }

                showModal('팀이 성공적으로 생성되었습니다.');
                teamNameInput.value = ''; // Clear form
                loadTeams(); // Refresh lists

            } catch (error) {
                console.error("Error creating team: ", error);
                showModal('팀 생성 중 오류가 발생했습니다.');
            }
        });
    }

    // Initial load
    loadApplicants();
});