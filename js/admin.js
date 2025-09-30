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

    // Initial load
    loadApplicants();
});