<script lang="ts">
	import { onMount } from 'svelte';
	import PartySocket from 'partysocket';

	type Message = {
		type: 'offer';
		data: Offer;
	};

	type Offer = {
		sdp: string | undefined;
		type: RTCSdpType;
	};

	let partySocket: PartySocket;
	let pc = new RTCPeerConnection();
	let localStream: MediaStream | null = null;
	let video = document.getElementById('video');

	onMount(async () => {
		partySocket = new PartySocket({
			host: 'localhost:1999',
			room: 'test'
		});

		// interface RTCIceCandidateInit {
		//     candidate?: string;
		//     sdpMLineIndex?: number | null;
		//     sdpMid?: string | null;
		//     usernameFragment?: string | null;
		// }

		await startStream();
		pc.onicecandidate = (event) => {
			event.candidate && partySocket.send(JSON.stringify(event.candidate.toJSON()));
		};
		const offer: Offer = await createOffer();

		partySocket.send(JSON.stringify(offer));
		partySocket.addEventListener('message', (msg) => {
			const message: Message = JSON.parse(msg.data);
			if (message.type === 'offer') {
				handleOffer(message.data as Offer);
			}
		});
	});

	const handleOffer = (offer: Offer) => {
		if (!pc.currentRemoteDescription && )
	};

	const startStream = async () => {
		localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
		localStream.getTracks().forEach((t) => pc.addTrack(t, localStream!));
		video!.srcObject = localStream;
	};

	const createOffer = async () => {
		const desc = await pc.createOffer();
		await pc.setLocalDescription(desc);

		return {
			sdp: desc.sdp,
			type: desc.type
		} satisfies Offer;
	};
</script>

<h1>Super basic walkie talkie app</h1>

<!-- svelte-ignore a11y-media-has-caption -->
<video id="video" autoplay playsinline bind:this={video} />
