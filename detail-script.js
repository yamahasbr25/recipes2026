document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    let keywordFromQuery = params.get('q') || '';
    
    // Membersihkan keyword dari URL
    const cleanQuery = keywordFromQuery.replace(/-/g, ' ').trim();
    
    const detailTitle = document.getElementById('detail-title');
    const detailImageContainer = document.getElementById('detail-image-container');
    const detailBody = document.getElementById('detail-body');
    const relatedPostsContainer = document.getElementById('related-posts-container');
    
    // Mulai proses pencarian resep
    if (cleanQuery) {
        fetchRecipe(cleanQuery);
    } else {
        fetchRandomRecipe();
    }

    // Fungsi mencari resep berdasarkan keyword
    function fetchRecipe(keyword) {
        detailBody.innerHTML = '<div class="loader">Loading recipe details...</div>';
        
        fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(keyword)}`)
            .then(response => response.json())
            .then(data => {
                if (data.meals && data.meals.length > 0) {
                    displayRecipe(data.meals[0]);
                } else {
                    // Jika resep tidak ditemukan, langsung panggil resep acak (tanpa pesan error)
                    detailImageContainer.innerHTML = '';
                    fetchRandomRecipe();
                }
            })
            .catch(error => {
                console.error('Error fetching recipe:', error);
                fetchRandomRecipe();
            });
    }

    // Fungsi mengambil resep acak
    function fetchRandomRecipe() {
        fetch('https://www.themealdb.com/api/json/v1/1/random.php')
            .then(response => response.json())
            .then(data => {
                if (data.meals) {
                    displayRecipe(data.meals[0]);
                }
            });
    }

    // Fungsi menampilkan data resep ke dalam HTML
    function displayRecipe(meal) {
        // Set Judul Langsung dari API
        detailTitle.textContent = meal.strMeal;
        document.title = `${meal.strMeal} Recipe | TastyBites`;

        // Set Gambar
        detailImageContainer.innerHTML = `<img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">`;

        // Mengambil daftar bahan & takaran dari API
        let ingredientsHTML = '<ul class="ingredients-list">';
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            
            if (ingredient && ingredient.trim() !== '') {
                ingredientsHTML += `<li><strong>${measure}</strong> ${ingredient}</li>`;
            }
        }
        ingredientsHTML += '</ul>';

        // Format cara memasak yang lebih rapi (Memecah baris baru menjadi paragraf tersendiri)
        // Ini menghindari teks berantakan jika ada list nomor (1. 2. 3.)
        const stepsArray = meal.strInstructions.split(/\r?\n/).filter(step => step.trim() !== '');
        const instructionsFormatted = stepsArray.map(step => `<p class="step-item">${step.trim()}</p>`).join('');

        // Ekstraksi ID Video YouTube & Membuat Embed Player Responsif
        let youtubeVideoEmbed = '';
        if (meal.strYoutube) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = meal.strYoutube.match(regExp);
            const videoId = (match && match[2].length === 11) ? match[2] : null;
            
            if (videoId) {
                youtubeVideoEmbed = `
                    <div class="recipe-video">
                        <h2>Video Tutorial</h2>
                        <div class="video-container">
                            <iframe 
                                src="https://www.youtube.com/embed/${videoId}" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                `;
            }
        }

        // Kategori & Asal Masakan (Tags)
        const metaTags = `
            <div class="recipe-meta">
                <span class="badge">🍽️ Category: ${meal.strCategory}</span>
                <span class="badge">🌍 Origin: ${meal.strArea}</span>
            </div>
        `;

        // Susun HTML dengan struktur Grid Profesional
        const bodyContent = `
            ${metaTags}
            <div class="recipe-layout-grid">
                <div class="recipe-ingredients">
                    <h2>Ingredients</h2>
                    ${ingredientsHTML}
                </div>
                <div class="recipe-instructions">
                    <h2>Instructions</h2>
                    <div class="instructions-text">
                        ${instructionsFormatted}
                    </div>
                    ${youtubeVideoEmbed}
                </div>
            </div>
        `;

        // Masukkan ke dalam halaman (langsung menimpa teks loading)
        detailBody.innerHTML = bodyContent;

        // Panggil resep terkait berdasarkan kategori
        fetchRelatedPosts(meal.strCategory, meal.idMeal);
    }

    // Fungsi menampilkan resep terkait (Related Posts)
    function fetchRelatedPosts(category, currentMealId) {
        fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`)
            .then(response => response.json())
            .then(data => {
                if (data.meals) {
                    relatedPostsContainer.innerHTML = '';
                    let count = 0;
                    
                    const shuffledMeals = data.meals.sort(() => 0.5 - Math.random());
                    
                    shuffledMeals.forEach(meal => {
                        if (meal.idMeal !== currentMealId && count < 5) {
                            count++;
                            const keywordForUrl = meal.strMeal.replace(/\s/g, '-').toLowerCase();
                            const linkUrl = `detail.html?q=${encodeURIComponent(keywordForUrl)}`;
                            
                            const card = `
                                <article class="content-card">
                                    <a href="${linkUrl}">
                                        <img src="${meal.strMealThumb}/preview" alt="${meal.strMeal}" loading="lazy">
                                        <div class="content-card-body">
                                            <h3>${meal.strMeal}</h3>
                                        </div>
                                    </a>
                                </article>
                            `;
                            relatedPostsContainer.innerHTML += card;
                        }
                    });

                    const relatedSection = document.querySelector('.related-posts-section');
                    if (count > 0) {
                        relatedSection.style.display = 'block';
                    }
                }
            });
    }
});
