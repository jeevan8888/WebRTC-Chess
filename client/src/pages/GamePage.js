import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { useMediaQuery } from "react-responsive";
import { getSocketInstance } from "../socket";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ImClipboard } from "react-icons/im";
import { GiFlyingFlag } from "react-icons/gi";
import { MdVideocam } from "react-icons/md";

function GamePage() {
  const v1 = useMediaQuery({ query: "(max-width: 406px)" });
  const v2 = useMediaQuery({ query: "(max-width: 416px)" });
  const v3 = useMediaQuery({ query: "(max-width: 436px)" });
  const v4 = useMediaQuery({ query: "(max-width: 466px)" });
  const v5 = useMediaQuery({ query: "(max-width: 1156px)" });
  const v6 = useMediaQuery({ query: "(max-width: 1224px)" });
  const v7 = useMediaQuery({ query: "(max-width: 392px)" });
  const v8 = useMediaQuery({ query: "(max-width: 373px)" });
  const v9 = useMediaQuery({ query: "(max-width: 355px)" });

  const socketInstance = getSocketInstance();
  const location = useLocation();
  const navigate = useNavigate();
  const { gameId } = useParams();
  let { color, clients, mySocketID } = location.state;
  const game = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const peerInstance = useRef(null);
  const captureAudioRef = useRef(null);
  const moveAudioRef = useRef(null);
  const [people, setPeople] = useState([]);
  const [fen, setFen] = useState("start");
  const [showNewgame, setShowNewGame] = useState(false);
  const [stream, setStream] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);
  const [callingPerson, setSetCallingPerson] = useState(null);
  const [showCallingButton, setShowCallingButton] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  const hideredButtonref = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        localStream.current.srcObject = stream;
      });

    socketInstance.on("giveSignal", (data) => {
      setShowCallingButton(true);
      setCallerSignal(data.signal);
      setSetCallingPerson(data.from);
    });
  }, []);

  const answerCall = () => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socketInstance.emit("answerCall", { signal: data, to: callingPerson });
    });

    peer.on("stream", (stream) => {
      remoteStream.current.srcObject = stream;
      remoteStream.current.addEventListener("loadedmetadata", () => {
        remoteStream.current.play();
      });
    });

    console.log("peer", peer);
    peer.signal(callerSignal);
    peerInstance.current = peer;
    setShowCallingButton(false);
  };

  useEffect(() => {
    if (clients && clients.length === 2 && mySocketID) {
      setShowStartButton(true);
      socketInstance.emit('showResign', clients , gameId )
    }

    socketInstance.on('setPeople', (people)=>{
      setPeople(people);
    } )



  }, [location.state]);

  const makeCall = () => {
    var anotherClient = clients.filter((client) => {
      return client.socketId !== mySocketID;
    });
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socketInstance.emit("callUser", {
        userToCall: anotherClient[0].socketId,
        signalData: data,
        mysocketId: mySocketID,
      });
    });

    peer.on("stream", (stream) => {
      remoteStream.current.srcObject = stream;
      remoteStream.current.addEventListener("loadedmetadata", () => {
        remoteStream.current.play();
      });
    });

    socketInstance.on("callAccepted", (signal) => {
      peer.signal(signal);
      peerInstance.current = peer;
    });
    hideredButtonref.current.style.display = "none";
  };

  useEffect(() => {
    game.current = new Chess();
  }, []);

  useEffect(() => {
    socketInstance.on("receiving move", (fen, sourceSquare, targetSquare) => {
      setFen(fen);
      game.current.move({
        from: sourceSquare,
        to: targetSquare,
      });
    });

    socketInstance.on("leaving_guys", (clients) => {
      toast.success("Other player Resigned");
      setPeople(clients);
      clients = null;
      setShowNewGame(true);
    });
  }, []);

  const resign = () => {
    socketInstance.emit("leave_room", gameId);
    window.location.href = "https://chess-game-wheat.vercel.app";
  };

  const newGame = () => {
    window.location.href = "https://chess-game-wheat.vercel.app";
  };

  const onDrop = (sourceSquare, targetSquare) => {
    let move = game.current.move({
      from: sourceSquare,
      to: targetSquare,
    });
    if (move === null) return;
    setFen(game.current.fen());
    socketInstance.emit(
      "new move",
      game.current.fen(),
      gameId,
      sourceSquare,
      targetSquare
    );

    if (move) {
      if (move.flags.includes("c")) {
        captureAudioRef.current.play();
      } else {
        moveAudioRef.current.play();
      }
    }
  };

  const resetGame = () => {
    game.current.clear();
    game.current.reset();
    setFen("start");
  };

  async function copyGameId() {
    try {
      await navigator.clipboard.writeText(gameId);
      toast.success("Game ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the Game ID");
      console.error(err);
    }
  }

  return (
    <div className="App">
      <div className="img">
        <img
          src="/images/logo.png"
          alt=""
          onClick={() => {
            navigate("/");
          }}
        />
      </div>
      <div className="clipboard">
        <div className="div">
          <span>{gameId}</span>
          <button onClick={copyGameId}>
            {" "}
            <ImClipboard size={16} /> Copy to Clip-board
          </button>
          {(clients && clients.length && clients.length === 2) ||
          (people && people.length && people.length === 2) ? (
            <button
              className="resign"
              style={{ display: `${showNewgame && "none"}` }}
              onClick={resign}
            >
              <GiFlyingFlag size={16} /> Resign
            </button>
          ) : null}
          {showNewgame && (
            <button className="new_game" onClick={newGame}>
              {" "}
              <GiFlyingFlag size={16} />
              new Game
            </button>
          )}
        </div>
      </div>
      <div className="constainer">
        <div className="left">
          <Chessboard
            boardWidth={
              v9
                ? 270
                : v8
                ? 290
                : v7
                ? 310
                : v6
                ? 330
                : v5
                ? 340
                : v4
                ? 350
                : v3
                ? 370
                : v2
                ? 400
                : v1
                ? 500
                : 550
            }
            position={fen}
            boardOrientation={color ? "white" : "black"}
            onPieceDrop={onDrop}
            customBoardStyle={{ boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5 " }}
          />
          {game.current && game.current.game_over() ? (
            <div className="game_over">
              <div className="incenter">
                <h1>Game Over</h1>
                <button onClick={resetGame}>Play Again</button>
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
        <div className="right">
          <div className="wrapper">
            <div className="persons">
              <video autoPlay id="me" muted ref={localStream}></video>
            </div>
            <div className="persons">
              <video id="him" controls ref={remoteStream}></video>
              {showStartButton && (
                <div
                  className="answercall"
                  ref={hideredButtonref}
                  onClick={makeCall}
                >
                   <MdVideocam size={16} /> start call  
                </div>
              )}
              {showCallingButton && (
                <div className="acceptcall" onClick={answerCall}>
                 <MdVideocam size={16} /> accept call
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <audio
        ref={captureAudioRef}
        src="/capture.mp3"
        style={{ visibility: "hidden" }}
      />
      <audio
        ref={moveAudioRef}
        src="/move-self.mp3"
        style={{ visibility: "hidden" }}
      />
    </div>
  );
}

export default GamePage;
