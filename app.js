const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

// Configurar a conexão com o banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'phpmyadmin',
    password: 'giovanna',
    database: 'mydb',
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        throw err;
    }
    console.log('Conexão com o banco de dados MySQL estabelecida.');
});

// Configurar a sessão
app.use(
    session({
        secret: 'Escreva aqui a senha para criptografar as sessões.',
        resave: true,
        saveUninitialized: true,
    })
);

// Configuração de pastas com aquivos estáticos
//app.use('/img', express.static(__dirname + '/img'))
app.use('/', express.static(__dirname + '/static'));

// Engine do Express para processar o EJS (templates)
// Lembre-se que para uso do EJS uma pasta (diretório) 'views', precisa existir na raiz do projeto.
// E que todos os EJS serão processados a partir desta pasta
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar EJS como o motor de visualização
app.set('view engine', 'ejs');

// Configuração das rotas do servidor HTTP
// A lógica ddo processamento de cada rota deve ser realizada aqui
app.get('/', (req, res) => {
    // Passe a variável 'req' para o template e use-a nas páginas para renderizar partes do HTML conforme determinada condição
    // Por exemplo de o usuário estive logado, veja este exemplo no arquivo views/partials/header.ejs
    res.redirect('/posts');
    // Caso haja necessidade coloque pontos de verificação para verificar pontos da sua logica de negócios
    console.log(`${req.session.username ? `Usuário ${req.session.username} logado no IP ${req.connection.remoteAddress}` : 'Usuário não logado.'}  `);
    //console.log(req.connection)
    ;
});

// Rota para a página de login
app.get('/login', (req, res) => {
    // Quando for renderizar páginas pelo EJS, passe parametros para ele em forma de JSON
    res.render('pages/login', { req: req });
});



app.get('/about', (req, res) => {
    res.render('pages/about', { req: req })
});


app.get('/posts', (req, res) => {
    // const dados = [
    //     { titulo: "Post 1", conteudo: "Conteúdo 1"},
    //     { titulo: "Post 2", conteudo: "Conteúdo 2"},
    //     { titulo: "Post 3", conteudo: "Conteúdo 3"}
    // ]

    const query = 'SELECT * FROM posts;'
    db.query(query, [], (err, results) => {
        if (err) throw err;
            // res.send('Credenciais incorretas. <a href="/">Tente novamente</a>');

    res.render('pages/pgposts', { req: req, posts: results, totalPosts: results.length})
});
});

// Rota para processar o formulário de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? AND password = SHA1(?)';

    db.query(query, [username, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.username = username;
            res.redirect('/dashboard');
        } else {
            // res.send('Credenciais incorretas. <a href="/">Tente novamente</a>');
            res.redirect('/login_failed');
        }
    });
});

// Rota para processar o formulário de caastro depostagem
app.post('/cadastrar_posts', (req, res) => {
    const { titulo, conteudo  } = req.body;
    const autor = req.session.username;
    const datapostagem = new Date();
    // const query = 'SELECT * FROM users WHERE username = ? AND password = SHA1(?)';
    const query = 'INSERT INTO posts (titulo, conteudo, autor, datapostagem) VALUES (?, ?, ?, NOW())';

    db.query(query, [titulo, conteudo, autor, datapostagem], (err, results) => {
        if (err) throw err;
        console.log(`Rotina cadastrar posts: ${JSON.stringify(results)}`);
        if (results.affectedRows > 0) {
            console.log('Cadastro de postagem OK')
            res.redirect('/dashboard');
        } else {
            // res.send('Credenciais incorretas. <a href="/">Tente novamente</a>');
            res.send('Cadastro de post não efetuado');
        }
    });
});


// // Rota para excluir um post
// app.delete('/excluir_post/:postId', (req, res) => {
//     const postId = req.params.postId;

//     const query = 'DELETE FROM posts WHERE id = ?';

//     db.query(query, [postId], (err, results) => {
//         if (err) {
//             console.error('Erro ao excluir o post:', err);
//             res.json({ success: false });
//         } else {
//             res.json({ success: true });
//         }
//     });
// });

app.post('/deletePost', (req, res) => {
    const postId = req.body.postId;
  
    // Implemente a lógica para excluir o post do banco de dados usando o postId
    const sql = 'DELETE FROM posts WHERE id = ?';
    db.query(sql, [postId], (err, result) => {
      if (err) throw err;
      console.log('Post excluído com sucesso.');
  
      // Redireciona para a página que exibe a lista atualizada de posts
      res.redirect('/lista_posts');
    });
  });

  // Rota para excluir todos os posts
app.post('/deleteAllPosts', (req, res) => {
    // Implemente a lógica para excluir todos os posts do banco de dados
    const sql = 'DELETE FROM posts';
    db.query(sql, (err, result) => {
      if (err) throw err;
      console.log('Todos os posts excluídos com sucesso.');
  
      // Redireciona para a página que exibe a lista atualizada de posts
      res.redirect('/');
    });
  });
  


// const query = 'INSERT INTO users (username, password) VALUES (?, SHA1(?))';
// console.log(`POST /CADASTAR -> query -> ${query}`);
// db.query(query, [username, password], (err, results) => {
//     console.log(results);
//     //console.log(`POST /CADASTAR -> results -> ${results}`);

//     if (err) {
//         console.log(`ERRO NO CADASTRO: ${err}`);
//         throw err;
//     }
//     if (results.affectedRows > 0) {
//         req.session.loggedin = true;
//         req.session.username = username;
//         res.redirect('/register_ok');
//     }
// });


// Rota para a página cadastro do post
app.get('/cadastrar_posts', (req, res) => {
    // Quando for renderizar páginas pelo EJS, passe parametros para ele em forma de JSON
    if (req.session.loggedin) {
        res.render('pages/cadastrar_posts', { req: req });
    } else {
        res.redirect('/post_failed');
    }
});

app.get('/lista_posts', (req, res) => {
    const query = 'SELECT * FROM posts;';
    if (req.session.loggedin) {
        db.query(query, (err, results) => {
            if (err) throw err;

            // Verifica se há algum post
            const hasPosts = results.length > 0;

            res.render('pages/lista_posts', { req: req, posts: results, hasPosts: hasPosts, totalPosts: results.length });
        });
    } else {
        res.redirect('/login_failed');
    }
});



// app.get('/lista_posts', (req, res) => {
//     // Passe a variável 'req' para o template e use-a nas páginas para renderizar partes do HTML conforme determinada condição
//     // Por exemplo de o usuário estive logado, veja este exemplo no arquivo views/partials/header.ejs
//     res.redirect('/lista');
//     // Caso haja necessidade coloque pontos de verificação para verificar pontos da sua logica de negócios
   
//     //console.log(req.connection)
//     ;
// });

// Rotas para cadastrar
app.get('/cadastrar', (req, res) => {
    if (!req.session.loggedin) {
        res.render('pages/cadastrar', { req: req });
    } else {
        res.redirect('pages/dashboard', { req: req });
    }
});

app.post('/editar_post/:id', (req, res) => {
    const { conteudo } = req.body;
    const id = req.params.id;
    console.log(`/editar_post -> req.body: ${JSON.stringify(req.body)}`)
    // UPDATE `posts` SET `conteudo`='[value-3]' WHERE id=23
    // const sql = `
    //   UPDATE posts
    //   SET conteudo = ?
    //   WHERE id = ?;
    // `;
    const sql = "UPDATE posts SET conteudo=? WHERE id=?;"
    console.log(`${sql}`);
    db.query(sql, [conteudo, id], (error, results, fields) => {
        if (error) {
            console.log('Erro ao editar o conteúdo do post:', error);
            res.status(500).send('Erro ao editar o conteúdo do post');
        } else {
            console.log('Conteúdo do post editado com sucesso');
            res.redirect('/'); // Redireciona o usuário de volta para a página inicial após editar o post
        }
    });
});


app.get('/editarpost', (req, res) => {
    // Recupera o ID do post da URL
    const query = 'SELECT * FROM posts WHERE id = "?";'
    db.query(query, (err, results) => {
        if (err) throw err;
        console.log(`GET /editarpost -> ${JSON.stringify(results)}`)

        // Renderiza a página de edição, passando o ID do post para o formulário
        res.render('pages/editarpost', { req: req, post: results });
    })
});

app.post('/editarpost', (req, res) => {
    const {postId} = req.body;
    console.log(`/editarpost -> req.body: ${JSON.stringify(req.body)}`)

    // Consulta o banco de dados para obter os detalhes do post com o ID fornecido
    const query = 'SELECT * FROM posts WHERE id = ?';
    db.query(query, [postId], (err, results) => {
        if (err) {
            console.error('Erro ao recuperar detalhes do post:', err);
            res.status(500).send('Erro ao recuperar detalhes do post');
            return;
        }

        // Renderiza a página de edição, passando o ID do post e os detalhes do post para o formulário
        res.render('pages/editarpost', { req: req, postId: postId, post: results[0] });
    });
});


app.post('/deletePost', (req, res) => {
    const postId = req.body.postId;

    // Implemente a lógica para excluir o post do banco de dados usando o postId
    const sql = 'DELETE FROM posts WHERE id = ?';
    db.query(sql, [postId], (err, result) => {
        if (err) throw err;
        console.log('Post excluído com sucesso.');

        // Redireciona para a página que exibe a lista atualizada de posts
        res.redirect('/lista_posts');
    });
});

// Rota para excluir todos os posts
app.post('/deleteAllPosts', (req, res) => {
    // Implemente a lógica para excluir todos os posts do banco de dados
    const sql = 'DELETE FROM posts';
    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log('Todos os posts excluídos com sucesso.');

        // Redireciona para a página que exibe a lista atualizada de posts
        res.redirect('/');
    });
});

// Rota para efetuar o cadastro de usuário no banco de dados
app.post('/cadastrar', (req, res) => {
    const { username, password } = req.body;

    // Verifica se o usuário já existe
    const query = 'SELECT * FROM users WHERE username = ? AND password = SHA1(?)';
    db.query(query, [username, password], (err, results) => {
        if (err) throw err;
        // Caso usuário já exista no banco de dados, redireciona para a página de cadastro inválido
        if (results.length > 0) {
            console.log(`Usuário ${username} já existe no banco de dados. redirecionando`);
            res.redirect('/register_failed');
        } else {
            // Cadastra o usuário caso não exista
            const query = 'INSERT INTO users (username, password) VALUES (?, SHA1(?))';
            console.log(`POST /CADASTAR -> query -> ${query}`);
            db.query(query, [username, password], (err, results) => {
                console.log(results);
                //console.log(`POST /CADASTAR -> results -> ${results}`);

                if (err) {
                    console.log(`ERRO NO CADASTRO: ${err}`);
                    throw err;
                }
                if (results.affectedRows > 0) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    res.redirect('/register_ok');
                }
            });
        }
    });
});

app.get('/register_failed', (req, res) => {
    res.render('pages/register_failed', { req: req });
});

app.get('/register_ok', (req, res) => {
    res.render('pages/register_ok', { req: req });
});

app.get('/login_failed', (req, res) => {
    res.render('pages/login_failed', { req: req });
});

app.get('/post_failed', (req, res) => {
    res.render('pages/post_failed', { req: req });
});

app.get('/page_failed', (req, res) => {
    res.render('pages/page_failed', { req: req });
});




// Rota para a página do painel
app.get('/dashboard', (req, res) => {
    //
    //modificação aqui
    if (req.session.loggedin) {
        //res.send(`Bem-vindo, ${req.session.username}!<br><a href="/logout">Sair</a>`);
        // res.sendFile(__dirname + '/index.html');
        res.render('pages/dashboard', { req: req });
    } else {
        res.send('Faça login para acessar esta página. <a href="/">Login</a>');
    }
});

// Rota para processar a saida (logout) do usuário
// Utilize-o para encerrar a sessão do usuário
// Dica 1: Coloque um link de 'SAIR' na sua aplicação web
// Dica 2: Você pode implementar um controle de tempo de sessão e encerrar a sessão do usuário caso este tempo passe.
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Rota de teste
app.get('/teste', (req, res) => {
    res.render('pages/teste', { req: req });
});


app.listen(3000, () => {
    console.log('----Login (MySQL version)-----')
    console.log('Servidor rodando na porta 3000');
});
