import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getSocketInstance } from "../socket";

function HomePage() {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState();
  const socketRef = useRef(null);
  const colorRef = useRef(true);
  const [clients, setClients] = useState([]);
  const [mySocketID, setMySocketId] = useState();
  


  useEffect(() => {
    const init = async () => {
      socketRef.current = await getSocketInstance();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Connection failed! Please refresh the page");  
      }

      socketRef.current.on("status", (num) => {
        setStatus(num);
      });

      socketRef.current.on("joined", ({ clients, username, socketId }) => {
        if (username) {
          toast.success(`${username} joined the Game.`);
        }
        setClients(clients);
        setMySocketId(socketId)
        
      });


      socketRef.current.on("dis_connect", ({ socketId, username }) => {
        toast.success(`${username} left the Game.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
      
    };
    init();
  }, []);

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setGameId(id);
  };

  const x = () => {
    if (status === 1) {
      let isCalling = false
      let color = colorRef.current;
      setTimeout(() => {
        navigate(`/game/${gameId}`, {
          state: { username, color, clients, mySocketID, isCalling },
        });
      }, 1000);
    }
    else if (status === 2) {
      let isCalling = true 
      colorRef.current = false;
      let color = colorRef.current;
      setTimeout(() => {
        navigate(`/game/${gameId}`, {
          state: { username, color, clients, mySocketID, isCalling },
        });
      }, 1000);
    } 
    else if (status === 3) {
      return;
    }
  };

  x();


  const joinGame = () => {
    if (!gameId || !username) {
      toast.error("GAME ID & username is required");
      return;
    }
    if (gameId.length < 6 ) {
      toast.error("GAME ID must be atleast 6 figures long");
      return;
    }

    socketRef.current.emit("join", {
      gameId,
      username,
    });
  };


  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinGame();
    }
  };



  return (
    <div className="homePage">
      <img src='/hero.webp' alt="" />
      <div className="box">
        <h4 className="mainLabel">Paste invitation Game ID</h4>
        <div className="inputGroup">
          <input
            type="text"
            className="inputBox"
            placeholder="Game ID"
            onChange={(e) => setGameId(e.target.value)}
            value={gameId}
            onKeyUp={handleInputEnter}
          />
          <input
            type="text"
            className="inputBox"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            onKeyUp={handleInputEnter}
          />
          <button className="btn joinBtn" onClick={joinGame}>
            Join
          </button>
          {status === 1 ? (
            <span className="status">
              No Game with this Id. Starting a new Game 💥
            </span>
          ) : status === 2 ? (
            <span className="status">Joining the Game ❤ </span>
          ) : (
            status === 3 && (
              <span className="status">
                {" "}
                Oops! 2 People already playing. Create new Game 🙃
              </span>
            )
          )}
        </div>
        <div className="createInfo">
          <span>
            If you don't have an invite then create &nbsp;
            <a onClick={createNewRoom} href="/" className="createNewBtn">
              new Game
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
