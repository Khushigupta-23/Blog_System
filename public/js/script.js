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
        mainContent.classList.add('hidden');
        blogFormContainer.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        blogFormContainer.classList.add('hidden');
        mainContent.classList.remove('hidden');
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
        submitText.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

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
                blogFormContainer.classList.add('hidden');
                mainContent.classList.remove('hidden');
                loadBlogs();
            } else {
                alert(result.error || 'Error posting blog');
            }
        } catch (error) {
            alert('Error posting blog');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitText.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
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
        editSubmitText.classList.add('hidden');
        editLoadingSpinner.classList.remove('hidden');

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
            editSubmitText.classList.remove('hidden');
            editLoadingSpinner.classList.add('hidden');
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
            div.className = 'bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer blog-card';
            div.setAttribute('data-bs-toggle', 'modal');
            div.setAttribute('data-bs-target', '#blogModal');
            div.setAttribute('data-title', blog.title);
            div.setAttribute('data-author', blog.author);
            div.setAttribute('data-date', new Date(blog.created_at).toLocaleString());
            div.setDrivenByData('data-content', blog.content.replace(/"/g, '&quot;'));
            div.setAttribute('data-category', blog.category);
            div.innerHTML = `
                <div class="flex items-center mb-3">
                    <img src="https://api.dicebear.com/9.x/initials/svg?seed=${blog.author}" alt="Avatar" class="w-10 h-10 rounded-full mr-3">
                    <h5 class="text-lg font-semibold text-gray-800">${blog.title}</h5>
                </div>
                <p class="text-gray-600 text-sm mb-3">By ${blog.author} | ${blog.category} | ${new Date(blog.created_at).toLocaleString()}</p>
                <p class="text-gray-700">${blog.content.substring(0, 100)}${blog.content.length > 100 ? '...' : ''}</p>
                ${blog.user_id === userId ? `
                    <div class="mt-3 flex gap-2">
                        <button class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all edit-btn" data-id="${blog.id}" data-title="${blog.title}" data-category="${blog.category}" data-content="${blog.content.replace(/"/g, '&quot;')}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all delete-btn" data-id="${blog.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                ` : ''}
                <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
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