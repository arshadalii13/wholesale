document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const statusMsg = document.getElementById('status-message');
    const adminGrid = document.getElementById('admin-product-grid');
    const adminLoading = document.getElementById('admin-loading');

    const showMessage = (msg, isError = false) => {
        statusMsg.textContent = msg;
        statusMsg.style.display = 'block';
        statusMsg.style.backgroundColor = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
        statusMsg.style.color = isError ? '#fca5a5' : '#86efac';
        statusMsg.style.border = `1px solid ${isError ? '#ef4444' : '#22c55e'}`;
    };

    // ─── Load & Render Products for Admin ─────────────────────────
    const loadAdminProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const products = await res.json();
            adminLoading.style.display = 'none';

            if (products.length === 0) {
                adminGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No products yet.</p>';
                return;
            }

            adminGrid.innerHTML = '';
            products.forEach(product => {
                const coverImg = product.images && product.images.length > 0 ? product.images[0] : '';
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.id = product.id;
                card.innerHTML = `
                    <div class="card-img-wrapper" style="height: 180px;">
                        <div class="slider-container">
                            <img src="${coverImg}" alt="${product.title}" class="slider-image active">
                        </div>
                        <span class="card-category-badge">${product.category.replace('-', ' ')}</span>
                    </div>
                    <div class="card-content">
                        <div class="card-header">
                            <h3 class="card-title" style="font-size: 1rem;">${product.title}</h3>
                            <span class="card-price">₹${product.price}</span>
                        </div>
                        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 1rem;">${product.images ? product.images.length : 0} photo(s)</p>
                        <div class="card-actions">
                            <button class="delete-btn" data-id="${product.id}" style="
                                display: inline-flex; align-items: center; gap: 0.4rem;
                                background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4);
                                color: #fca5a5; padding: 0.5rem 1rem; border-radius: 8px;
                                font-family: inherit; font-size: 0.85rem; cursor: pointer;
                                transition: all 0.2s ease; width: 100%; justify-content: center;">
                                🗑️ Delete Product
                            </button>
                        </div>
                    </div>
                `;
                adminGrid.appendChild(card);
            });

            // Attach delete listeners
            adminGrid.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    const title = btn.closest('.product-card').querySelector('.card-title').textContent;
                    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

                    btn.textContent = 'Deleting...';
                    btn.disabled = true;

                    try {
                        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
                        const result = await res.json();
                        if (res.ok && result.success) {
                            btn.closest('.product-card').remove();
                        } else {
                            alert(result.error || 'Failed to delete product.');
                            btn.textContent = '🗑️ Delete Product';
                            btn.disabled = false;
                        }
                    } catch (err) {
                        alert('Network error. Could not delete.');
                        btn.textContent = '🗑️ Delete Product';
                        btn.disabled = false;
                    }
                });
            });

        } catch (err) {
            adminLoading.textContent = 'Failed to load products.';
        }
    };

    loadAdminProducts();

    // ─── Upload Form Submit ────────────────────────────────────────
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusMsg.style.display = 'none';

        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Uploading...';
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('title', uploadForm.querySelector('#title').value);
        formData.append('price', uploadForm.querySelector('#price').value);
        formData.append('category', uploadForm.querySelector('#category').value);
        formData.append('description', uploadForm.querySelector('#description').value);
        
        const fileInput = uploadForm.querySelector('#images');
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('images', fileInput.files[i]);
        }

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage('✅ Product successfully added to the catalog!');
                uploadForm.reset();
                // Reload admin product list
                adminGrid.innerHTML = '<p id="admin-loading" style="color: var(--text-secondary); grid-column: 1/-1;">Loading products...</p>';
                loadAdminProducts();
            } else {
                showMessage(result.error || 'Server error occurred during upload', true);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            showMessage('❌ Network error. Failed to connect to server.', true);
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
