interface AudioPlayerProps {
    title: string;
    audioUrl: string;
  }
  
  const AudioPlayer = ({ title, audioUrl }: AudioPlayerProps) => {
    return (
      <div className="text-center mt-3">
        <h5>{title}</h5>
        <audio controls className="mt-2">
          <source src={audioUrl} type="audio/mpeg" />
          Tu navegador no soporta el reproductor de audio.
        </audio>
      </div>
    );
  };
  
  export default AudioPlayer;
  