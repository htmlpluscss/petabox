( btn => {

	let windowScroll = window.pageYOffset;

	btn.addEventListener('click', () => {

		if ( document.body.classList.contains('menu-show') ) {

			document.body.classList.remove('menu-show');
			window.scrollTo(0,windowScroll);

			setTimeout( () => document.documentElement.classList.remove('scroll-behavior-off'));

		} else {

			windowScroll = window.pageYOffset;

			document.documentElement.classList.add('scroll-behavior-off');

			setTimeout( () => {

				document.body.classList.add('menu-show');
				window.scrollTo(0,0);

			});

		}

	});


// menu

	const menu = document.querySelector('.header__menu');

	menu.addEventListener('click', event => {

		if ( event.target.closest('a') && event.target.closest('a').href.includes('#') ) {

			document.body.classList.remove('menu-show');
			window.scrollTo(0,windowScroll);

			setTimeout( () => document.documentElement.classList.remove('scroll-behavior-off'));

		}

	});

})(document.querySelector('.btn-menu'));