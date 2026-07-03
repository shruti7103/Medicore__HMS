import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp } from 'lucide-react';

export default function TelemedicineRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [audioMuted, setAudioMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [sharing, setSharing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!videoOff && videoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: !audioMuted })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                }).catch(console.error);
        } else if (videoOff && videoRef.current) {
            const stream = videoRef.current.srcObject as MediaStream;
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
                videoRef.current.srcObject = null;
            }
        }
    }, [videoOff, audioMuted]);

    return (
        <DashboardLayout title="Telemedicine" links={[]}>
            <div className="flex h-[calc(100vh-8rem)] flex-col lg:flex-row gap-4">
                <div className="flex-1 rounded-xl overflow-hidden bg-black relative flex flex-col relative">
                    {/* Simulated Remote Video */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 border-b border-gray-700 h-full w-full">
                        <span className="text-white">Connecting to peer...</span>
                    </div>

                    {/* Local Video */}
                    <div className="absolute bottom-4 right-4 w-48 h-32 bg-gray-800 rounded-lg overflow-hidden border border-gray-600 shadow-xl z-20">
                        {videoOff ? (
                            <div className="flex items-center justify-center h-full text-white">Video Off</div>
                        ) : (
                            <video ref={videoRef} autoPlay playsInline muted className="object-cover w-full h-full transform scale-x-[-1]" />
                        )}
                    </div>
                </div>

                <div className="w-full lg:w-80 flex flex-col card p-0">
                    <div className="p-4 border-b border-[var(--color-border)] font-bold text-lg">
                        Chat
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs text-gray-500">System</span>
                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg text-sm text-gray-800 dark:text-gray-200">
                                Call started. Welcome to Room {roomId?.split('-')[0]}.
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-[var(--color-border)] flex gap-2">
                        <input className="input-field flex-1" placeholder="Type a message..." />
                        <button className="btn-primary">Send</button>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/90 p-4 rounded-full shadow-2xl backdrop-blur">
                <button type="button" onClick={() => setAudioMuted(!audioMuted)} 
                        className={`p-4 rounded-full text-white ${audioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {audioMuted ? <MicOff /> : <Mic />}
                </button>
                <button type="button" onClick={() => setVideoOff(!videoOff)}
                        className={`p-4 rounded-full text-white ${videoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {videoOff ? <VideoOff /> : <Video />}
                </button>
                <button type="button" onClick={() => setSharing(!sharing)}
                        className={`p-4 rounded-full text-white ${sharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    <MonitorUp />
                </button>
                <button type="button" onClick={() => navigate(-1)}
                        className="p-4 rounded-full text-white bg-red-600 hover:bg-red-700 ml-4">
                    <PhoneOff />
                </button>
            </div>
        </DashboardLayout>
    );
}
