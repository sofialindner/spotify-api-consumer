// Importa módulos (classes) a serem utilizadas nas requests
var express = require('express');
var request = require('request');
var crypto = require('crypto');               // Usado para gerar strings aleatórias
var cors = require('cors');                   // Usado para habilitar o compartilhamento entre as origens
var querystring = require('querystring');     // Usado para formatar as URIs de consulta
var cookieParser = require('cookie-parser');  // Usado para análise dos cookies das requests

// Credenciais do cliente do app criado para conexão com a API
var client_id = '1d8262c235db4d7ba8736c46d7e0e338';
var client_secret = '377a786a010d47e59df592335a4f6cdf';
var redirect_uri = 'http://localhost:9999/callback';

const generateRandomString = (length) => {
  return crypto
  .randomBytes(60)
  .toString('hex')
  .slice(0, length);
}

var stateKey = 'spotify_auth_state';

// Ciação de um objeto do tipo Express, que possui métodos para requests HTTP
var app = express();

// Método que estabelece um middleware (bloco de código intermediário) a ser executado antes de toda rota
app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

// GET para a rota '/login', que solicita código de autorização baseado no client id
app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // Escopos necessários para acesso e manipulação das playlists
  var scope = 'playlist-modify-private playlist-modify-public';

  // Redireciona solicitação para rota de permissão (login) do Spotify, e, se autorizada, redireciona novamente para a aplicação
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

// GET para a rota '/callback', que corresponde à inicial da aplicação
app.get('/callback', function(req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    // Objeto init que será passado como segundo parâmetro do fetch, estabelecendo as suas configurações
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'  // Tipo de autorização requerida pela API para acesso de user resources
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    // POST que solicita a criação de uma nova sessão de acesso à API
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        /* Apesar de ser um POST, por tratar-se de uma autenticação, ou seja, por conta da natureza da requisição, que lida
          com recursos temporários, no caso, os tokens, a requisição retorna o status 200, não o 201, já que o último refere-se ao
          sucesso de criação de recursos permanentes no servidor */ 

        var access_token = body.access_token,
            refresh_token = body.refresh_token; // Request retorna tokens de acesso do usuário

        // Redireciona para a página de criação de playlists, passando os tokens como query parameters
        res.redirect(`/create-playlist?access_token=${access_token}&refresh_token=${refresh_token}`);
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

// GET para a rota de criação de playlists
app.get('/create-playlist', function(req, res) {
  res.sendFile(__dirname + '/public/main.html');  // Arquivo da página principal da aplicação
});


// GET para rota de refresh do token de acesso
app.get('/refresh_token', function(req, res) {
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) 
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  // POST que solicita novamente a criação de uma sessão de acesso à API
  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token,
          refresh_token = body.refresh_token;
      res.send({
        'access_token': access_token,
        'refresh_token': refresh_token
      });
    }
  });
});

// Inicializa o app na porta 9999 do localhost
app.listen(9999);
console.log('App inicializado com sucesso.');

