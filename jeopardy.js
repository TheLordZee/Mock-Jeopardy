// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ] 
function setUp() {
    $('body').append(`
     <div class="container text-center">
        <h1 class= "text"> Jeopardy!</h1 >
            <button class="text btn btn-info m-2 mb-3" id="start">Start!</button>
            <div id="load-screen"></div>
            <div class="container justify-content-center" id="game"></div>
      </div>`
    )
}

setUp();


$('#start').on('click', function (e) {
    $('#game').empty();
    e.target.disabled = true;
    console.log(e.target.innerText);
    new Game();
});


class Game{
    constructor(height = 5, width = 6) {
        this.height = height;
        this.width = width;
        this.gameOver = false;
        this.categories = [];
        this.totalCategories = [];
        this.idList = [];
        this.showLoadingView();
        this.setupAndStart()
    }

    /** Get NUM_CATEGORIES random category from API.
     *
     * Returns array of category ids
     */

    async getCategoryIds() {
        try {
            if (this.totalCategories.length === 0) {
                const promises = []
                for (let x = 0; x < 5; x++) {
                    promises.push(axios.get(`http://jservice.io/api/categories?count=100&offset=${x}00`));
                }
                const fulfilled = await Promise.all(promises);
                for (let response of fulfilled) {
                    for (let item of response.data) {
                        this.totalCategories.push(item);
                    }
                }
                
            }

            for (let x = 0; x < this.width; x++) {
                const ranId = Math.floor(Math.random() * (this.totalCategories.length - 1))
                if (this.idList.indexOf(this.totalCategories[ranId].id) === -1){
                    this.idList.push(this.totalCategories[ranId].id);
                }
            }
        }  catch (e) {
            alert('Failed to get IDs!')
        }    
    } 
    

    /** Return object with data about a category:
     *
     *  Returns { title: "Math", clues: clue-array }
     *
     * Where clue-array is:
     *   [
     *      {question: "Hamlet Author", answer: "Shakespeare", showing: null}   ,
     *      {question: "Bell Jar Author", answer: "Plath", showing: null},
     *      ...
     *   ]
     */

    async getCategory(catId) {
        try {
            const category = await axios.get(`http://jservice.io/api/category?id=${catId}`);
            return category.data;
        } catch (e) {
            alert('failed to get Category!')
        }
    }

    /** Fill the HTML table#jeopardy with the categories & cells for    questions.
     *
     * - The <thead> should be filled w/a <tr>, and a <td> for each category
     * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
     *   each with a question for each category in a <td>
     *   (initally, just show a "?" where the question/answer would go.)
     */

    async fillTable() {
        console.log(this.idList);
        try {
            const $game = $('#game')
            const $htmlBoard = $(`
                <table>
                    <thead>
                        <tr id = "heading"></tr>
                    </thead>
                    <tbody id="body">
                    </tbody>
                </table>
            `)

            $game.append($htmlBoard);

            const totalCats = []

            for (let x = 0; x < this.idList.length; x++) {
                const cats = this.getCategory(this.idList[x]);
                totalCats.push(cats)
            }

            const response = await Promise.all(totalCats);
            console.log(response);
            
            for (let x = 0; x < this.idList.length; x++) {
                this.categories.push(response[x]);
                const heading = $(`<td id="${this.idList[x]}" class = "text border border-light text-light">${this.categories[x].title}</td>`)
                $('#heading').append(heading);
            }
            

            for (let y = 0; y < this.height; y++) {
                const row = $('<tr></tr>')
                const gameBody = this;

                for (let x = 0; x < this.width; x++) {
                    let currQuestion;
                    let currCatt;
                    let currAnswer;
                    const gameBody = this;

                    if (x < this.width) {
                        currCatt = response[x];
                        currQuestion = currCatt.clues[y].question;
                        currAnswer = currCatt.clues[y].answer;
                    }

                    const cell = $(`
                        <td class = "border border-light">
                            <div id = "${x}${y}" class = "covered text-center align-items-center justify-content-center">
                                <i class="fas fa-question-circle fs-1 text-light"></i>
                            </div>
                            <div id = "${gameBody.idList[x]}-${y}" class = "text text-wrap question text-light text-center align-items-center justify-content-center">
                            ${currQuestion}
                            </div>
                            <div id = "${gameBody.idList[x]}-${y}-${y}" class = "text text-wrap answer text-light align-items-center justify-content-center text-center">
                            ${currAnswer}
                            </div>
                        </td>
                    `)
                    
                    row.append(cell);
                }
                $('#body').append(row);
                $('#body').on('click', 'td', function (e) {
                    gameBody.handleClick(e)
                }) 
            }

            this.hideLoadingView();
        } catch (e) {
            alert("Something went wrong!")
            throw new Error(e);
        }
    }

    /** Handle clicking on a clue: show the question or answer.
     *
     * Uses .showing property on clue to determine what to show:
     * - if currently null, show question & set .showing to "question"
     * - if currently "question", show answer & set .showing to "answer"
     * - if currently "answer", ignore click
     * */

    handleClick(evt) {
        // console.log(evt.target.tagName);
        // console.log(evt.target.innerHTML);
        let currSel;
        if (evt.target.tagName === 'I') {
            currSel = evt.target.parentElement;
        } else if (evt.target.tagName === "TD") {
            currSel = evt.target.firstElementChild;
        } else if (evt.target.tagName === 'DIV') {
            currSel = evt.target;
        }

        //console.log(currSel.id)
        
        if (currSel.classList.contains('covered')) {
            $(`#${currSel.id}`).hide();
            $(`#${this.idList[currSel.id[0]]}-${currSel.id[1]}`).css('display', 'flex');
        }
        if (currSel.classList.contains('question')) {
            console.log(currSel.id)
            $(`#${currSel.id}`).hide();
            $(`#${currSel.id}-${currSel.id[currSel.id.length - 1]}`).css('display', 'flex');
        }
        // console.log(currSel.firstElementChild);
    }

    /** Wipe the current Jeopardy board, show the loading spinner,
     * and update the button used to fetch data.
     */

    showLoadingView() {
        $('#start').empty();
        document.getElementById('start').innerHTML = 'Loading! ';
        $('#start').append($('<i class="fas fa-spinner fa-pulse"></i>'))
        $('#load-screen').append($('<i id="loading" class="mt-4 fas fa-spinner fa-pulse"></i>'))
    }

    /** Remove the loading spinner and update the button used to fetch data.    */

    hideLoadingView() {
        $('#start').empty();
        $('#load-screen').empty();
        document.getElementById('start').innerHTML = 'New Game';
        $('#game').css('display', 'flex')
        $('#start')[0].disabled = false;
    }

    /** Start game:
     *
     * - get random category Ids
     * - get data for each category
     * - create HTML table
     * */

    async setupAndStart() {
            $('#game').css('display', 'none');
            await this.getCategoryIds();
            await this.fillTable();
    }

    /** On click of start / restart button, set up game. */

    // TODO

    /** On page load, add event handler for clicking clues */

    // TODO
}
