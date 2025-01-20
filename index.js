const express = require('express');
const handlebars = require('express-handlebars');

const readMovies = require('./middlewares/readerMiddleware')
const saveMovies = require('./middlewares/saverMiddleware')
const path = require('path');
const methodOverride = require('method-override');
const { status, render } = require('express/lib/response');

const app = express();

app.engine('hbs', handlebars.engine({
    extname: 'hbs',
}));

app.set('view engine', 'hbs');
app.use(methodOverride('_method'))
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const filePath = './movies.json';

app.get('/', (req, res) => {
    res.render('home', { title: 'Movie List' })
});

app.get('/add-movie', (req, res) => {
    res.render('form', {
        isEdit: false,
    });
});

app.post('/add-movie', (req, res) => {
    const movies = readMovies();

    const { genre, title, year, image, imdb, description } = req.body;
    console.log(req.body);

    const isAlreadyExist = movies.some(movie => movie.title === title);
    res.render('messages', {
        title,
        isAlreadyExist,
    })

    if (!genre || !title || !year || !image || !imdb || !description) {
        return res.status(404).send('Invalid movie data...');
    };

    const newMovie = { genre, title, year, image, imdb, description };
    movies.push(newMovie);
    saveMovies(movies);
    console.log(title);

    res.render('messages', { movie: newMovie });
})

app.get('/movies', (req, res) => {
    const movies = readMovies();
    res.render('movie-list', {
        title: 'ALL MOVIES',
        movies: movies,
    });
});

app.get('/movies/:genre', (req, res) => {
    const genre = req.params.genre;
    const movies = readMovies();
    console.log(genre);


    const filteredMovies = movies.filter(movie => movie.genre.toLowerCase() === genre.toLowerCase());

    res.render('movie-list', {
        title: `${genre.toUpperCase()} MOVIES`,
        movies: filteredMovies,
    });
});

app.get('/:title/details/', (req, res) => {
    const movies = readMovies();
    
    const currentMovie = movies.find(movie => movie.title.toLowerCase() == req.params.title.toLowerCase());
    
    if (currentMovie) {
        res.render('movie-details', currentMovie);
    }   
});

app.post('/search', (req, res) => {
    const movies = readMovies();
    const title = req.body.title;

    // Намиране на филма
    const movie = movies.find(m => m.title.toLowerCase() === title.toLowerCase());

    if (movie) {
        // Пренасочване към страницата с детайли за намерения филм
        return res.redirect(`/${title}/details`);
    }

    // Ако филмът не е намерен
    res.status(404).render('messages', {
        title: title,
        isNotFound: true,
    });
});

app.get('/:title/details/edit', (req, res) => {
    console.log('GET REQUEST');

    const movies = readMovies();
    const currentMovie = movies.find(movie => movie.title == req.params.title)
    res.render(path.join(__dirname, 'views', 'form.hbs'), {
        currentMovie, isEdit: true,
    });
});

app.post('/:title/details/edit', (req, res) => {
    const { genre, title, image, imdb, description, year } = req.body;

    // Валидация на входните данни
    if (!genre || !title || !image || !imdb || !description || !year || isNaN(parseInt(year, 10))) {
        return res.status(400).send('Invalid movie data');
    }

    // Четене на текущите филми
    const movies = readMovies();

    // Намиране на индекса на текущия филм
    const movieIndex = movies.findIndex(movie => movie.title === req.params.title);

    if (movieIndex === -1) {
        return res.status(404).send('Movie not found');
    }

    // Обновяване на филма
    movies[movieIndex] = {
        ...movies[movieIndex], // Запазване на останалите свойства
        genre,
        title,
        image,
        imdb,
        description,
        year: parseInt(year, 10),
    };

    // Запазване на обновения масив в JSON файла
    saveMovies(movies);

    res.redirect(`/${title}/details`); // Пренасочване към списъка с филми
});

app.get('/:title/details/delete', (req, res) => {
    const movies = readMovies();
    const title = req.params.title;
    const currentMovie = movies.find(movie => movie.title == req.params.title);
    res.render('movie-delete', { currentMovie, title });

});

app.post('/:title/details/delete', (req, res) => {
    const title = req.params.title
    const movies = readMovies();
    const movieIndex = movies.findIndex(movie => movie.title === req.params.title);
    const isDeleted = false;

    if (movieIndex === -1) {
        return res.status(404).send('Movie not found');
    };

    movies.splice(movieIndex, 1)

    saveMovies(movies)

    res.render('messages', {
        title,
        isDeleted: true,
    });
});



app.listen(3000, () => console.log('Server is listening on http://localhost:3000...'));