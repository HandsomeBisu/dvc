
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const agreementSection = document.getElementById('agreement-section');
    const formSection = document.getElementById('form-section');
    const nextBtn = document.getElementById('next-btn');
    const agreementChecks = document.querySelectorAll('.agreement-check');

    const applyForm = document.getElementById('apply-form');
    const modal = document.getElementById('custom-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalSpinner = document.getElementById('modal-spinner');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Load agreement content
    const loadAgreementContent = async () => {
        const termsRef = doc(db, "agreements", "content");
        try {
            const docSnap = await getDoc(termsRef);
            if (docSnap.exists() && window.marked) {
                const data = docSnap.data();
                document.getElementById('agreement-content-check').innerHTML = marked.parse(data.check || '');
                document.getElementById('agreement-content-conditions').innerHTML = marked.parse(data.conditions || '');
                document.getElementById('agreement-content-coc').innerHTML = marked.parse(data.coc || '');
                document.getElementById('agreement-content-privacy').innerHTML = marked.parse(data.privacy || '');
            } else {
                console.log("No such document or marked.js not found!");
            }
        } catch (error) {
            console.error("Error loading terms: ", error);
        }
    };

    if (agreementSection && formSection && nextBtn && agreementChecks.length > 0) {
        loadAgreementContent(); // Load content on page load

        const checkAgreements = () => {
            const allChecked = Array.from(agreementChecks).every(checkbox => checkbox.checked);
            nextBtn.disabled = !allChecked;
        };

        agreementChecks.forEach(checkbox => {
            checkbox.addEventListener('change', checkAgreements);
        });

        nextBtn.addEventListener('click', () => {
            agreementSection.classList.add('fade-out');

            setTimeout(() => {
                agreementSection.style.display = 'none';
                formSection.style.display = 'block';
                formSection.classList.add('fade-in');
            }, 500); // Corresponds to the animation duration
        });
    }

    if (!applyForm || !modal) return;

    const showModal = (message, isLoading = false) => {
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

    const hideModal = () => {
        modal.classList.remove('visible');
    };

    modalCloseBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    applyForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        showModal('', true);

        try {
            const formData = {
                applicantName: applyForm['applicant-name'].value,
                contact: applyForm['contact'].value,
                class: applyForm['class'].value,
                riotId: applyForm['riot-id'].value,
                currentTier: applyForm['current-tier'].value,
                peakTier: applyForm['peak-tier'].value,
                status: 'pending',
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "applications"), formData);

            setTimeout(() => {
                window.location.href = 'apply-success.html';
            }, 1500);

        } catch (e) {
            console.error("Error adding document: ", e);
            showModal("신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
    });
});
