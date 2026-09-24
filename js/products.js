(() => {
    const PRODUCTS_DATA_URL = '../data/products.json';
    const currencyFormatter = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0
    });

    let products = [];

    function getProducts(data) {
        return Array.isArray(data) ? data : [data];
    }

    function formatPrice(price) {
        return currencyFormatter.format(Number(price) || 0);
    }

    function getImagePath(image) {
        return image || '../media/products/product-placeholder.jpg';
    }

    function addOptions(select, values, label) {
        select.innerHTML = `<option value="">${label}</option>`;
        values.sort((first, second) => first.localeCompare(second)).forEach((value) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }

    function populateFilters() {
        const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
        const brands = [...new Set(products.map((product) => product.brand).filter(Boolean))];
        const subcategories = [...new Set(products.map((product) => product.subcategory).filter(Boolean))];
        addOptions(document.getElementById('category-filter'), categories, 'All Categories');
        addOptions(document.getElementById('brand-filter'), brands, 'All Brands');
        addOptions(document.getElementById('subcategory-filter'), subcategories, 'All Subcategories');

        const brandParam = decodeURIComponent(new URLSearchParams(window.location.search).get('brand') || '').trim();
        const brandFilter = document.getElementById('brand-filter');
        if (brandFilter && brandParam) {
            const matchingOption = [...brandFilter.options].find((option) => option.value === brandParam);
            if (matchingOption) {
                brandFilter.value = matchingOption.value;
            }
        }
    }

    function getFilteredProducts() {
        const search = document.getElementById('product-search').value.trim().toLowerCase();
        const category = document.getElementById('category-filter').value;
        const urlBrand = decodeURIComponent(new URLSearchParams(window.location.search).get('brand') || '').trim();
        const brand = document.getElementById('brand-filter').value || urlBrand;
        const subcategory = document.getElementById('subcategory-filter').value;
        const sort = document.getElementById('sort-filter').value;

        const filteredProducts = products.filter((product) => {
            const searchableText = [product.name, product.brand, product.category, product.subcategory].join(' ').toLowerCase();
            return (!search || searchableText.includes(search))
                && (!category || product.category === category)
                && (!brand || product.brand === brand)
                && (!subcategory || product.subcategory === subcategory);
        });

        return filteredProducts.sort((first, second) => {
            if (sort === 'name-asc') return first.name.localeCompare(second.name);
            if (sort === 'name-desc') return second.name.localeCompare(first.name);
            if (sort === 'price-asc') return Number(first.price) - Number(second.price);
            if (sort === 'price-desc') return Number(second.price) - Number(first.price);
            return 0;
        });
    }

    function renderProducts() {
        const grid = document.getElementById('product-grid');
        const count = document.getElementById('product-count');
        const filterBrand = decodeURIComponent(new URLSearchParams(window.location.search).get('brand') || '').trim();
        const brandFilter = document.getElementById('brand-filter');
        if (brandFilter && filterBrand && !brandFilter.value) {
            const matchingOption = [...brandFilter.options].find((option) => option.value === filterBrand);
            if (matchingOption) {
                brandFilter.value = matchingOption.value;
            }
        }

        const filteredProducts = getFilteredProducts();
        count.textContent = `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} found`;

        if (!filteredProducts.length) {
            grid.innerHTML = '<div class="empty-state"><h2>No products found.</h2><p>Try adjusting your search or filters.</p></div>';
            return;
        }

        grid.innerHTML = filteredProducts.map((product) => `
            <div class="product-card-shell">
                <a class="product-card" href="product-details.html?id=${encodeURIComponent(product.id)}">
                    <div class="product-image-wrap">
                        <img class="product-image" src="${getImagePath(product.image)}" alt="${product.name}">
                    </div>
                    <div class="product-card-body">
                        <p class="product-brand">${product.brand || ''}</p>
                        <h2>${product.name}</h2>
                        <p class="product-type">${product.subcategory || product.category || ''}</p>
                        <p class="product-price">${formatPrice(product.price)}</p>
                    </div>
                </a>
                <button class="product-card-action" type="button" data-product-id="${product.id}" aria-label="Add ${product.name} to cart">Add to Cart</button>
            </div>
        `).join('');

        document.querySelectorAll('.product-card-action').forEach((button) => {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (typeof window.addToCart === 'function') {
                    window.addToCart(this.dataset.productId);
                }
            });
        });
    }

    function clearFilters() {
        document.getElementById('product-search').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('brand-filter').value = '';
        document.getElementById('subcategory-filter').value = '';
        document.getElementById('sort-filter').value = 'default';
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('brand');
        window.history.replaceState({}, '', currentUrl);
        renderProducts();
    }

    function showProductDetails(product) {
        const details = document.getElementById('product-details');
        if (!product) {
            details.innerHTML = '<div class="empty-state details-empty"><h1>Product Not Found</h1><p>The product you are looking for could not be found.</p><a class="btn btn-accent" href="products.html">Back to Products</a></div>';
            return;
        }

        document.title = `${product.name} | Muuko's Emporium`;
        details.innerHTML = `
            <a class="back-link" href="products.html">&larr; Back to Products</a>
            <div class="product-detail-layout">
                <div class="product-detail-image-wrap">
                    <img class="product-detail-image" src="${getImagePath(product.image)}" alt="${product.name}">
                </div>
                <div class="product-detail-copy">
                    <p class="eyebrow">${product.brand || 'MUUKO\'S EMPORIUM'}</p>
                    <h1>${product.name}</h1>
                    <div class="product-meta"><span>${product.category || ''}</span><span>${product.subcategory || ''}</span></div>
                    <p class="product-detail-price">${formatPrice(product.price)}</p>
                    <div class="product-description"><h2>Description</h2><p>${product.description || 'Product description coming soon.'}</p></div>
                    <button class="btn btn-accent" type="button" id="add-to-cart">Add to Cart</button>
                </div>
            </div>
        `;

        const addToCartButton = document.getElementById('add-to-cart');
        if (addToCartButton) {
            addToCartButton.addEventListener('click', function () {
                if (typeof window.addToCart === 'function') {
                    window.addToCart(product.id);
                }
            });
        }
    }

    async function loadProducts() {
        try {
            const response = await fetch(PRODUCTS_DATA_URL);
            if (!response.ok) throw new Error('Unable to load product data.');
            products = getProducts(await response.json());

            if (document.getElementById('product-grid')) {
                populateFilters();
                const initialBrand = decodeURIComponent(new URLSearchParams(window.location.search).get('brand') || '').trim();
                const brandFilter = document.getElementById('brand-filter');
                if (brandFilter && initialBrand) {
                    const matchingOption = [...brandFilter.options].find((option) => option.value === initialBrand);
                    if (matchingOption) {
                        brandFilter.value = matchingOption.value;
                    }
                }

                ['product-search', 'category-filter', 'brand-filter', 'subcategory-filter', 'sort-filter'].forEach((id) => {
                    document.getElementById(id).addEventListener(id === 'product-search' ? 'input' : 'change', () => {
                        const currentUrl = new URL(window.location.href);
                        const selectedBrand = document.getElementById('brand-filter')?.value || '';

                        if (selectedBrand) {
                            currentUrl.searchParams.set('brand', selectedBrand);
                        } else {
                            currentUrl.searchParams.delete('brand');
                        }

                        window.history.replaceState({}, '', currentUrl);
                        renderProducts();
                    });
                });

                document.getElementById('clear-filters').addEventListener('click', clearFilters);
                renderProducts();
            }

            if (document.getElementById('product-details')) {
                const productId = new URLSearchParams(window.location.search).get('id');
                showProductDetails(products.find((product) => product.id === productId));
            }
        } catch (error) {
            const target = document.getElementById('product-grid') || document.getElementById('product-details');
            if (target) target.innerHTML = '<div class="empty-state"><h2>Products are unavailable.</h2><p>Please try again later.</p></div>';
            console.error(error);
        }
    }

    document.addEventListener('DOMContentLoaded', loadProducts);
})();
