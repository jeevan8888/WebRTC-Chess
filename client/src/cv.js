import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { useMediaQuery } from "react-responsive";
import { getSocketInstance } from "../socket";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ImClipboard } from "react-icons/im";
import { GiFlyingFlag } from "react-icons/gi";

function GamePage() {

  const third = useMediaQuery({ query: "(max-width: 1224px)" });
  const second = useMediaQuery({ query: "(max-width: 1156px)" });
  const first = useMediaQuery({ query: "(max-width: 466px)" });
  const last = useMediaQuery({ query: "(max-width: 436px)" });
  const final = useMediaQuery({ query: "(max-width: 416px)" });
  const seffb = useMediaQuery({ query: "(max-width: 406px)" });

  const location = useLocation();
  let { color, clients, mySocketID,isCalling } = location.state;
  const { gameId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef();
  const [fen, setFen] = useState("start");
  const [people, setPeople] = useState("start");
  const game = useRef(null);
  const [showNewgame, setShowNewGame] = useState(false);
  const localStream = useRef(null)
  const RemoteStream = useRef(null)
  const peerInstance = useRef(null);
  


  useEffect(() => {
    const peer = new Peer(mySocketID);

    peer.on('call', (call) => {
     const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      getUserMedia({ video: true, audio: true }, (mediaStream) => {
        localStream.current.srcObject = mediaStream;
        localStream.current.play();
        call.answer(mediaStream)

        call.on('stream', (remoteStream) => {
          RemoteStream.current.srcObject = remoteStream;
          RemoteStream.current.addEventListener("loadedmetadata", () => {
              RemoteStream.current.play();
          });
        });
      });
    })

    peerInstance.current = peer;

  }, [])


  useEffect(()=>{
   if(isCalling){
    if (clients && clients.length === 2) {
      
      var anotherClient = clients.filter((client) => {
        return client.socketId !== mySocketID;
      });

     
        const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    
        getUserMedia({ video: true, audio: true }, (mediaStream) => {
          localStream.current.srcObject = mediaStream;
          localStream.current.play();
    
          const call = peerInstance.current.call(anotherClient[0].socketId, mediaStream)

          call.on('stream', (remoteStream) => {
            RemoteStream.current.srcObject = remoteStream;
            RemoteStream.current.addEventListener("loadedmetadata", () => {
                RemoteStream.current.play();
            });
          });



        });
    }
   }
  },[clients])


  useEffect(() => {
    game.current = new Chess();
  }, []);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await getSocketInstance();

      socketRef.current.on(
        "receiving move",
        (fen, sourceSquare, targetSquare) => {
          setFen(fen);
          game.current.move({
            from: sourceSquare,
            to: targetSquare,
          });
        }
      );

      socketRef.current.on("all", (clients) => {
        setPeople(clients);
      });

      socketRef.current.on("leaving_guys", (clients) => {
        toast.success("Other player Resigned");
        setPeople(clients);
        setShowNewGame(true);
      });
    };
    init();
  }, []);

  const resign = () => {
    socketRef.current.emit("leave_room", gameId);
    window.location.href = 'http://localhost:3000'
  };

  const newGame = () => {
    window.location.href = 'http://localhost:3000'
  };

  const onDrop = (sourceSquare, targetSquare) => {
    let move = game.current.move({
      from: sourceSquare,
      to: targetSquare,
    });
    if (move === null) return;
    setFen(game.current.fen());
    socketRef.current.emit(
      "new move",
      game.current.fen(),
      gameId,
      sourceSquare,
      targetSquare
    );
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
        <img src="/images/logo.png" alt="" />
      </div>
      <div className="clipboard">
        <div className="div">
          <span>{gameId}</span>
          <button onClick={copyGameId}>
            {" "}
            <ImClipboard size={16} /> Copy to Clip-board
          </button>
          {(people && people.length && people.length === 2) ||
          (clients && clients.length && clients.length === 2) ? (
            <button
              className="resign"
              style={{ display: `${showNewgame && "none"}` }}
              onClick={resign}
            >
              {" "}
              <GiFlyingFlag size={16} /> Resign
            </button>
          ) : (
            ""
          )}
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
              seffb
                ? 330
                : final
                ? 340
                : last
                ? 350
                : first
                ? 370
                : second
                ? 400
                : third
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
              <video controls autoPlay id="me" ref={RemoteStream} ></video>
            </div>
            <div className="persons">
              <video controls autoPlay id="him" ref={localStream}></video>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamePage;