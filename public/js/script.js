document.addEventListener('DOMContentLoaded', () => {
    // Generate or retrieve user ID
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }

    // Toggle form visibility
    const toggleFormBtn = document.getElementById('toggleFormBtn');
    const blogFormContainer = document.getElementById('blogFormContainer');
    const mainContent = document.getElementById('mainContent');
    const cancelBtn = document.getElementById('cancelBtn');

    toggleFormBtn.addEventListener('click', () => {
        mainContent.classList.add('d-none');
        blogFormContainer.classList.remove('d-none');
    });

    cancelBtn.addEventListener('click', () => {
        blogFormContainer.classList.add('d-none');
        mainContent.classList.remove('d-none');
        document.getElementById('blogForm').reset();
    });

    // Blog submission
    document.getElementById('blogForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const author = document.getElementById('author').value;
        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const content = document.getElementById('content').value;

        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const loadingSpinner = document.getElementById('loadingSpinner');

        submitBtn.disabled = true;
        submitText.classList.add('d-none');
        loadingSpinner.classList.remove('d-none');

        try {
            const response = await fetch('/submit-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, title, category, content, user_id: userId })
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                document.getElementById('blogForm').reset();
                blogFormContainer.classList.add('d-none');
                mainContent.classList.remove('d-none');
                loadBlogs();
            } else {
                alert(result.error || 'Error posting blog');
            }
        } catch (error) {
            alert('Error posting blog');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitText.classList.remove('d-none');
            loadingSpinner.classList.add('d-none');
        }
    });

    // Edit blog form submission
    document.getElementById('editBlogForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const blogId = document.getElementById('editBlogId').value;
        const title = document.getElementById('editTitle').value;
        const category = document.getElementById('editCategory').value;
        const content = document.getElementById('editContent').value;

        const editSubmitBtn = document.getElementById('editSubmitBtn');
        const editSubmitText = document.getElementById('editSubmitText');
        const editLoadingSpinner = document.getElementById('editLoadingSpinner');

        editSubmitBtn.disabled = true;
        editSubmitText.classList.add('d-none');
        editLoadingSpinner.classList.remove('d-none');

        try {
            const response = await fetch(`/blogs/${blogId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, category, content })
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                bootstrap.Modal.getInstance(document.getElementById('editBlogModal')).hide();
                loadBlogs();
            } else {
                alert(result.error || 'Error updating blog');
            }
        } catch (error) {
            alert('Error updating blog');
            console.error(error);
        } finally {
            editSubmitBtn.disabled = false;
            editSubmitText.classList.remove('d-none');
            editLoadingSpinner.classList.add('d-none');
        }
    });

    // Load blogs on page load
    loadBlogs();
});

async function loadBlogs() {
    try {
        const response = await fetch('/blogs');
        const blogs = await response.json();
        const userId = localStorage.getItem('userId');
        
        const blogList = document.getElementById('blogList');
        blogList.innerHTML = '';
        
        blogs.forEach(blog => {
            const div = document.createElement('div');
            div.className = 'col-md-6 col-lg-4';
            div.innerHTML = `
                <div class="blog-card shadow-sm" data-bs-toggle="modal" data-bs-target="#blogModal" 
                     data-title="${blog.title}" data-author="${blog.author}" 
                     data-date="${new Date(blog.created_at).toLocaleString()}" 
                     data-content="${blog.content.replace(/"/g, '&quot;')}" data-category="${blog.category}">
                    <img src="https://api.dicebear.com/9.x/initials/svg?seed=${blog.author}" alt="Avatar" class="avatar">
                    <h5>${blog.title}</h5>
                    <p class="text-muted small">By ${blog.author} | ${blog.category} | ${new Date(blog.created_at).toLocaleString()}</p>
                    <p>${blog.content.substring(0, 100)}${blog.content.length > 100 ? '...' : ''}</p>
                    ${blog.user_id === userId ? `
                        <div class="mt-2">
                            <button class="btn btn-icon btn-outline-primary edit-btn me-2" data-id="${blog.id}" data-title="${blog.title}" data-category="${blog.category}" data-content="${blog.content.replace(/"/g, '&quot;')}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-icon btn-outline-danger delete-btn" data-id="${blog.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
            blogList.appendChild(div);
        });

        // Add click events for blog cards
        document.querySelectorAll('.blog-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn')) return;
                document.getElementById('blogModalLabel').textContent = card.getAttribute('data-title');
                document.getElementById('blogMeta').textContent = `By ${card.getAttribute('data-author')} | ${card.getAttribute('data-category')} | ${card.getAttribute('data-date')}`;
                document.getElementById('blogContent').textContent = card.getAttribute('data-content');
            });
        });

        // Add edit button events
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('editBlogId').value = btn.getAttribute('data-id');
                document.getElementById('editTitle').value = btn.getAttribute('data-title');
                document.getElementById('editCategory').value = btn.getAttribute('data-category');
                document.getElementById('editContent').value = btn.getAttribute('data-content');
                bootstrap.Modal.getInstance(document.getElementById('blogModal'))?.hide();
                new bootstrap.Modal(document.getElementById('editBlogModal')).show();
            });
        });

        // Add delete button events
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this blog?')) {
                    const blogId = btn.getAttribute('data-id');
                    try {
                        const response = await fetch(`/blogs/${blogId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        const result = await response.json();
                        if (response.ok) {
                            alert(result.message);
                            loadBlogs();
                        } else {
                            alert(result.error || 'Error deleting blog');
                        }
                    } catch (error) {
                        alert('Error deleting blog');
                        console.error(error);
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
    }
}