import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
        tab.addEventListener('click', () => {
            const target = document.getElementById(tab.dataset.tab);

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            tabContents.forEach(c => c.style.display = 'none');
            if (target) {
                target.style.display = 'block';
                // If switching to the terms tab, load the data
                if (tab.dataset.tab === 'terms') {
                    loadTermsData();
                }
            }
        });
    });

    // Load applicant list
    const applicantListBody = document.getElementById('applicant-list');
    const loadApplicants = async () => {
        if (!applicantListBody) return;
        applicantListBody.innerHTML = '<tr><td colspan="8">불러오는 중...</td></tr>';

        try {
            const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                applicantListBody.innerHTML = '<tr><td colspan="8">신청자가 없습니다.</td></tr>';
                return;
            }

            applicantListBody.innerHTML = ''; // Clear loading message
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const newRow = applicantListBody.insertRow();
                const date = data.createdAt.toDate();
                const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                newRow.innerHTML = `
                    <td>${data.applicantName || ''}</td>
                    <td>${data.contact || ''}</td>
                    <td>${data.class ? data.class + '반' : ''}</td>
                    <td>${data.riotId || ''}</td>
                    <td>${data.currentTier || ''}</td>
                    <td>${data.peakTier || ''}</td>
                    <td>${formattedDate}</td>
                    <td>${data.status || 'pending'}</td>
                `;
            });
        } catch (error) {
            console.error("Error fetching documents: ", error);
            applicantListBody.innerHTML = '<tr><td colspan="8">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>';
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