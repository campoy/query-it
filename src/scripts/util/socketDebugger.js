import { autobind } from 'core-decorators';
import socket from '../util/socket';
import $ from 'jquery';

export default class SocketDebugger {
  constructor($element) {
    this.runningInputs = {
      player1: {
        event: "playerInput",
        data: {
          running: '',
          submitted: false,
          client: 1,
        }
      },
      player2: {
        event: "playerInput",
        data: {
          running: '',
          submitted: false,
          client: 2,
        }
      }
    }
    this.singleCharRegex = new RegExp(/^[a-z ]$/);
    this.initialize();
  }

  @autobind
  initialize() {
    $(window).on('keypress', this.onKeyPress);
    $(window).on('keydown', this.onKeyDown);

    $(document).on('clear', function() {
      this.clearPlayer(1);
      this.clearPlayer(2);
    }.bind(this));

    var config = {
      apiKey: "AIzaSyDIIHS0S6QzTT2tCakn8wzW15t_9fvxWqE",
      authDomain: "launchpad-demos.firebaseapp.com",
      databaseURL: "https://launchpad-demos.firebaseio.com",
      storageBucket: "launchpad-demos.appspot.com",
      messagingSenderId: "341795040225"
    };
    firebase.initializeApp(config);
    
    var that = this;
    firebase.database().ref('keys').on('child_added', (s) => {
        var key = s.val().key;
        console.log(key);
        var obj = {
          'shiftKey':true,
          'keyCode':key.charCodeAt(0),
          'preventDefault':function(){}
        }
        if (key == 'ENTER'){
          that.submitPlayerAnswer(2);
        } else if (key == 'BACKSPACE'){
          that.runningInputs.player2.data.running = that.runningInputs.player2.data.running.substring(0, that.runningInputs.player2.data.running.length - 1);
        } else {
          that.runningInputs.player2.data.running += key.toLowerCase();
        }
        that.updateLocalInput(2);
        firebase.database().ref('keys').child(s.key).remove();
    });

  }

  @autobind
  submitPlayerAnswer(playerNum) {
    this.runningInputs['player' + playerNum].data.submitted = true;
    this.updateLocalInput(playerNum);
  }

  @autobind
  updateLocalInput(playerNum) {
    $(document).trigger("playerInput", {
      "running":this.runningInputs['player' + playerNum].data.running,
      "submitted":this.runningInputs['player' + playerNum].data.submitted,
      "client":playerNum});
  }

  @autobind
  clearPlayer(playerNum) {
    this.runningInputs['player' + playerNum].data.submitted = false;
    this.runningInputs['player' + playerNum].data.running = '';
    // this.logCurrent();
  }

  @autobind
  logCurrent() {
    console.log('--------');
    console.log('Player 1: ', this.runningInputs.player1.data.running, this.runningInputs.player1.data.submitted);
    console.log('Player 2: ', this.runningInputs.player2.data.running, this.runningInputs.player2.data.submitted);
  }

  @autobind
  onKeyDown(e) {
    if (e.keyCode === 8) {
      e.preventDefault();
      let run = this.runningInputs.player1.data.running;
      this.runningInputs.player1.data.running = run.slice(0, run.length - 1);
      this.updateLocalInput(1);
     // this.logCurrent();
    }
  }

  @autobind
  onKeyPress(e) {
    e.preventDefault();
    if (e.keyCode === 13) {
      this.submitPlayerAnswer(1);
    } else if (e.keyCode) {
      let key = String.fromCharCode(e.keyCode).toLowerCase();
      if (this.singleCharRegex.exec(key)) {
        this.runningInputs.player1.data.running += key;
        this.updateLocalInput(1);
      }
    }

    // this.logCurrent();
  }
}
