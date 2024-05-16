// Credenciais do cliente a serem utilizadas na requisição do token
const clientId = '1d8262c235db4d7ba8736c46d7e0e338';
const clientSecret = '377a786a010d47e59df592335a4f6cdf';

class Playlist {
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }
}

// Funções relacionadas à API, ou seja, todos os fetchs de request para o Spotify

async function createPlaylist(token, playlist) {
    const user = (await getUserData(token)).id;
    const path = `https://api.spotify.com/v1/users/${user}/playlists`; // Rota de criação de playlist, que requer o id do user 

    // Objeto no formato JSON da playlist passada como parâmetro 
    const playlistData = {
        name: playlist.name,
        description: playlist.description,
        public: false
    };

    // POST da playlist no Spotify
    fetch(path, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(playlistData),

        /* Visto que, por conta dos escopos de acesso às informações e playlists do usuário, os métodos POST e PUT não poderiam ser feitos
        somente com autorização client credentials, optou-se por gerar o token geral da aplicação através do flow de autorização
        authorization code (na API, é o flow com mais acesso) */
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok.");
        }
        return response.json();
    })
    .then((data) => {
        console.log(data);
        alert("Playlist cadastrada com sucesso!");
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("Desculpe, não foi possível criar a playlist.");
    });
}

async function updatePlaylist(token, id, playlist) {
    const path = `https://api.spotify.com/v1/playlists/${id}`; // Rota de alteração requer id da playlist a ser modificada

    const playlistData = {
        name: playlist.name,
        description: playlist.description,
        public: false
    };

    // PUT (update) das novas informações na playlist existente
    fetch(path, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token  //
        },
        body: JSON.stringify(playlistData),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok.");
        }
        alert("Playlist alterada com sucesso!");
        return response.json();
    })
    .then((data) => {
        console.log(data);
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("Desculpe, não foi possível alterar a playlist.");
    });
}

// GET dos dados do cliente conectado ao Spotify, que retorna um objeto JSON apenas com as propriedades essenciais para a aplicação
async function getUserData(token) {
    const result = await fetch(`https://api.spotify.com/v1/me`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await result.json();
    return {
        username: data.display_name,
        id: data.id,
        followers: data.followers,
        images: data.images
    };
}

// GET do array de gêneros (categorias) de música do Spotify
async function getGenres(token) {
    const result = await fetch(`https://api.spotify.com/v1/browse/categories?locale=sv_US`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await result.json();
    return data.categories.items;
}

// GET do array de playlists vinculadas à categoria selecionada, passada como parâmetro
async function getPlaylistByGenre(token, genreId) {
    const limit = 10; // Limita a quantidade retornada para apenas 10 playlists
    const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await result.json();
    return data.playlists.items;
}

// GET do array de tracks (músicas) pertencentes à playlist selecionada por meio do id da playlist
async function getTracks(token, tracksEndPoint) {
    const limit = 20; // Limita a quantidade retornada para apenas 20 tracks
    const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await result.json();
    return data.items;
}

// GET das informações do track passado como parâmetro a partir de seu id
async function getTrack(token, trackEndPoint) {
    const result = await fetch(`${trackEndPoint}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await result.json();
    return data; // Objeto JSON que contém os detalhes do track representados por pares nome/valor
}

// Objeto criado para fins organizacionais, de forma a dispensar o uso do id do elemento em cada função
const IDs = {
    selectGenre: '#select-genre',
    selectPlaylist: '#select-playlist',
    buttonSubmit: '#btn_submit',
    buttonPost: '#btn_post',
    buttonUpdate: '#btn_update',
    divSongDetail: '#song-detail',
    hfToken: '#hidden_token',
    cardSonglist: '#card-song-list',
    divSonglist: '.song-list',
    pName: '#playlist-name',
    pDescription: '#playlist-description',
    idPlaylist: '#playlist-id',
    newName: '#new-name',
    newDescription: '#new-description'
}

// Objeto que contém os métodos relacionados a mudanças diretamente na interface da aplicação (elementos HTML)
const UIController = (function () {

    return {
        // Função que serve unicamente para retornar os elementos HTML em si a serem usados na aplicação
        inputField() {
            return {
                genre: document.querySelector(IDs.selectGenre),
                playlist: document.querySelector(IDs.selectPlaylist),
                tracks: document.querySelector(IDs.divSonglist),
                submit: document.querySelector(IDs.buttonSubmit),
                post: document.querySelector(IDs.buttonPost),
                update: document.querySelector(IDs.buttonUpdate),
                cardSonglist: document.querySelector(IDs.cardSonglist),
                songDetail: document.querySelector(IDs.divSongDetail),
                pName: document.querySelector(IDs.pName),
                pDescription: document.querySelector(IDs.pDescription),
                idPlaylist: document.querySelector(IDs.idPlaylist),
                newName: document.querySelector(IDs.newName),
                newDescription: document.querySelector(IDs.newDescription)
            }
        },

        // Função que verifica se todos os campos de entrada do card passado estão preenchidos
        verifyInputs(card) {
            const inputs = card.querySelectorAll('input');

            let allFilled = true;
            inputs.forEach(input => {
                if (input.value == null || input.value == "" || input.value == undefined) {
                    allFilled = false;
                }
            });
            
            if (!allFilled) {
                alert("Preencha todos os campos antes de prosseguir.");
            }
            return allFilled; // Retorna um boleano
        },

        // Cria um elemento <option> no <select> cujo id foi passado
        createOption(elementId, text, value) {
            const html = `<option value="${value}">${text}</option>`;
            document.querySelector(elementId).innerHTML += html;
        },

        // Cria um elemento <a>, com o nome do track e o id (href), no menu de músicas da playlist selecionada
        createTrack(id, name) {
            const html = `<a href="#" id="${id}">${name}</a>`;
            document.querySelector(IDs.divSonglist).innerHTML += html;
        },

        // Cria o card com as informações do track clicado à direita do menu (divSongDetail)
        createTrackDetail(img, title, artist) {
            const detailDiv = document.querySelector(IDs.divSongDetail);
            detailDiv.innerHTML = '';
            const html = `
            <div>
                <img src="${img}" alt="Track cover">
                <h3>${title}</h3>
                <p>${artist}</p>
            </div>`;
            detailDiv.innerHTML += html;
        },

        // Métodos que limpam os cards e as inputs a ele pertencentes, de forma a resetá-los a cada nova consulta
        resetTrackDetail() {
            this.inputField().songDetail.innerHTML = '';
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            this.resetTrackDetail();
        },

        resetPlaylist() {
            this.inputField().playlist.innerHTML = '';
            this.resetTracks();
        },

        // Reseta as inputs do card passado como parâmetro
        resetInputs(card) {
            const inputs = card.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
            });
        },

        // Coloca o valor do token de acesso gerado na input escondida
        setToken(value) {
            document.querySelector(IDs.hfToken).value = value;
        },

        // Coloca o nome do usuário no elemento HTML de identificação, no canto superior direito 
        setUser(value) {
            document.querySelector("#display-name").innerText = value;
        },

        // Retorna o token armazenado na input escondida, criada única e propositalmente para esse fim
        getStoredToken() {
            return document.querySelector(IDs.hfToken).value;
        }
    }

})();

// Objeto com os métodos gerais da aplicação, que relacionam a interface (UIController) às requisições para a API (fetch)
const APPController = (function (UICtrl) {

    // Função chamada na inicialização do app
    async function loadPage() {
        //  Pega o token de acesso gerado pelo login por meio da URI (token passado como queryparameter)
        const currentURL = window.location.href;
        let urlParts = currentURL.split("=");
        urlParts = urlParts[1].split("&");
        const token = urlParts[0];

        // Armazena token na input do tipo hidden
        UICtrl.setToken(token);

        // Autentica visualmente na interface o usuário logado
        const user = (await getUserData(token)).username;
        UICtrl.setUser(user);

        // Carrega os gêneros em seu respectivo elemento select
        const genres = await getGenres(token);
        genres.forEach(element => 
            UICtrl.createOption(IDs.selectGenre, element.name, element.id)
        );
    }

    // Evento executado ao trocar a opção de gênero no select
    UICtrl.inputField().genre.addEventListener('change', async () => {
        UICtrl.inputField().cardSonglist.style.display = 'none'; // Card dos tracks some a cada nova consulta 
        UICtrl.resetPlaylist();

        const token = UICtrl.getStoredToken();
        const genreSelect = UICtrl.inputField().genre;
        const genreId = genreSelect.options[genreSelect.selectedIndex].value; // Pega o valor da opção selecionada
        const playlist = await getPlaylistByGenre(token, genreId);

        // Popula o select de playlists com as playlists retornadas
        playlist.forEach(p => 
            UICtrl.createOption(IDs.selectPlaylist, p.name, p.tracks.href)
        );
    });

    // Evento executado a clicar no botão de pesquisar
    UICtrl.inputField().submit.addEventListener('click', async (e) => {
        e.preventDefault();
        UICtrl.resetTracks(); // Elimina os tracks presentes no menu, se houver

        const token = UICtrl.getStoredToken();
        const playlistSelect = UICtrl.inputField().playlist;
        const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        const tracks = await getTracks(token, tracksEndPoint); // Retorna os tracks associados à option (playlist) cujo id foi passado

        // Popula o menu de tracks com os tracks retornados
        tracks.forEach(el =>
            UICtrl.createTrack(el.track.href, el.track.name)
        );
        UICtrl.inputField().cardSonglist.style.display = 'flex'; // Torna o card dos tracks visível novamente
    });

    // Evento executado ao clicar no botão de criar playlist
    UICtrl.inputField().post.addEventListener('click', async (e) => {
        e.preventDefault();
        const cardCreate = document.getElementById("form-post");
        
        // Verificação do preenchimento de todos os campos
        if (UICtrl.verifyInputs(cardCreate)) {
            // Pega conteúdo das inputs
            const name = UICtrl.inputField().pName.value;
            const description = UICtrl.inputField().pDescription.value;

            const playlist = new Playlist(name, description);
            const token = UICtrl.getStoredToken();

            // Realiza fetch de POST
            await createPlaylist(token, playlist);
        }
        UICtrl.resetInputs(cardCreate); // Limpa campos a cada tentativa de post (mesmo que tenha havido erro)
    });

    // Evento executado ao clicar no botão de alterar playlist
    UICtrl.inputField().update.addEventListener('click', async (e) => {
        e.preventDefault();
        const cardUpdate = document.getElementById("form-put");
        
        if (UICtrl.verifyInputs(cardUpdate)) {
            // Pega conteúdo das inputs
            const id = UICtrl.inputField().idPlaylist.value;
            const name = UICtrl.inputField().newName.value;
            const description = UICtrl.inputField().newDescription.value;

            const playlist = new Playlist(name, description);
            const token = UICtrl.getStoredToken();

            // Realiza fetch de PUT
            await updatePlaylist(token, id, playlist);
        }
        UICtrl.resetInputs(cardUpdate);
    })

    // Evento executado ao clicar em qualquer track do menu de tracks
    UICtrl.inputField().tracks.addEventListener('click', async (e) => {
        e.preventDefault();
        UICtrl.resetTrackDetail(); // Card de detalhes é resetado, caso estivesse já sendo exibido

        const token = UICtrl.getStoredToken();
        const trackEndpoint = e.target.id;
        const track = await getTrack(token, trackEndpoint);

        // Novo card de detalhes é criado, a partir das informaçõs do track clicado
        UICtrl.createTrackDetail(track.album.images[2].url, track.name, track.artists[0].name);
    });

    return {
        // Função de inicialização que chama a função de load
        init() {
            loadPage();
        }
    }
})(UIController); // UIController é usado como argumento, uma vez que o APPController precisa acessar seus métodos

// Inicialização
APPController.init();




