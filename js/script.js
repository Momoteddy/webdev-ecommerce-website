(function () {
    var loader = document.getElementById('page-loader');
    var loaderDismissed = false;

    function dismissPageLoader() {
        if (loaderDismissed) return;
        loaderDismissed = true;
        document.documentElement.classList.remove('is-loading');
        if (loader) loader.setAttribute('aria-hidden', 'true');
    }

    if (loader) {
        window.addEventListener('load', dismissPageLoader, { once: true });
        window.setTimeout(dismissPageLoader, 4500);
    }

    var toggle = document.querySelector('.navbar-toggler');
    var navigation = document.getElementById('mainNavigation');

    if (toggle && navigation) {
        toggle.addEventListener('click', function () {
            var isOpen = navigation.classList.toggle('show');
            toggle.setAttribute('aria-expanded', isOpen);
        });
    }

    var cartOffcanvas = document.getElementById('cartOffcanvas');
    var cartTriggerButtons = document.querySelectorAll('[data-bs-target="#cartOffcanvas"]');
    var backdrop = document.querySelector('.offcanvas-backdrop');

    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'offcanvas-backdrop';
        document.body.appendChild(backdrop);
    }

    function openCartPanel() {
        if (!cartOffcanvas) {
            return;
        }
        cartOffcanvas.classList.add('show');
        backdrop.classList.add('show');
        document.body.classList.add('offcanvas-open');
    }

    function closeCartPanel() {
        if (!cartOffcanvas) {
            return;
        }
        cartOffcanvas.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.classList.remove('offcanvas-open');
    }

    cartTriggerButtons.forEach(function (button) {
        button.addEventListener('click', openCartPanel);
    });

    backdrop.addEventListener('click', closeCartPanel);

    document.querySelectorAll('[data-bs-dismiss="offcanvas"]').forEach(function (button) {
        button.addEventListener('click', closeCartPanel);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && cartOffcanvas && cartOffcanvas.classList.contains('show')) {
            closeCartPanel();
        }
    });

    window.openCartPanel = openCartPanel;
    window.closeCartPanel = closeCartPanel;

    var contactForm = document.getElementById('contactForm');
    var formStatus = document.getElementById('formStatus');

    if (!contactForm || !formStatus) {
        return;
    }

    contactForm.addEventListener('submit', function (event) {
        event.preventDefault();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        // TODO: Connect this form to a real email/backend service if required later.
        formStatus.hidden = false;
        formStatus.classList.add('is-visible');
        contactForm.reset();
    });
}());