<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import PartySocket from 'partysocket';
	import { onDestroy, onMount } from 'svelte';
	import { nanoid } from 'nanoid';

	const servers = {
		iceServers: [
			{
				urls: ['stun3.l.google.com:19302', 'stun4.l.google.com:19302']
			}
		],
		iceCandidatePoolSize: 10
	};

	let callId: string | undefined;
	let partySocket: PartySocket | undefined;
	let pc: RTCPeerConnection | undefined;

	let localStream: MediaStream | undefined;
	let localVideo = document.getElementById('localvideo') as HTMLVideoElement;

	let remoteStream: MediaStream | undefined;
	let remoteVideo = document.getElementById('remotevideo') as HTMLVideoElement;

	onMount(async () => {
		pc = new RTCPeerConnection(servers);

		await setupVideo();
	});

	onDestroy(() => {
		partySocket?.close();
		localStream = undefined;
		remoteStream = undefined;
		pc?.close();
		callId = undefined;
	});

	const setupVideo = async () => {
		localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
		localStream.getTracks().forEach((t) => pc?.addTrack(t, localStream!));
		localVideo.srcObject = localStream;
		localVideo.muted = true;

		remoteStream = new MediaStream();
		pc!.ontrack = (e) => {
			e.streams[0].getTracks().forEach((t) => {
				remoteStream!.addTrack(t);
			});
		};
		remoteVideo.srcObject = remoteStream;
	};

	const startCall = async () => {
		callId = nanoid();
		partySocket = new PartySocket({
			host: 'webrtcdemo.andrew-r-thomas.partykit.dev',
			room: callId
		});

		pc!.onicecandidate = (e) => {
			e.candidate &&
				partySocket?.send(
					JSON.stringify({
						type: 'offer candidate',
						data: e.candidate.toJSON() satisfies OfferCandidate
					} satisfies Message)
				);
		};

		const offerDescription = await pc!.createOffer();
		await pc?.setLocalDescription(offerDescription);

		partySocket.send(
			JSON.stringify({
				type: 'offer',
				data: { sdp: offerDescription.sdp!, type: offerDescription.type } satisfies Offer
			} satisfies Message)
		);

		partySocket?.addEventListener('message', (msg) => {
			const message: Message = JSON.parse(msg.data);

			if (message.type === 'answer') {
				if (!pc!.currentRemoteDescription) {
					const answerDescription = new RTCSessionDescription(message.data as Answer);
					pc!.setRemoteDescription(answerDescription);
				}
			}
			if (message.type === 'answer candidate') {
				const candidate = new RTCIceCandidate(message.data as AnswerCandidate);
				pc!.addIceCandidate(candidate);
			}
		});
	};

	const joinCall = async () => {
		partySocket = new PartySocket({
			host: 'webrtcdemo.andrew-r-thomas.partykit.dev',
			room: callId!
		});

		pc!.onicecandidate = (e) => {
			e.candidate &&
				partySocket?.send(
					JSON.stringify({
						type: 'answer candidate',
						data: e.candidate.toJSON() satisfies AnswerCandidate
					} satisfies Message)
				);
		};

		const offerResp = await PartySocket.fetch(
			{ host: 'webrtcdemo.andrew-r-thomas.partykit.dev', room: callId! },
			{
				method: 'GET'
			}
		);
		const offerDescription: Offer = await offerResp.json();
		await pc?.setRemoteDescription(offerDescription);

		const answerDescription = await pc?.createAnswer();
		await pc?.setLocalDescription(answerDescription);

		const answer = {
			type: answerDescription!.type,
			sdp: answerDescription!.sdp!
		};

		partySocket.send(
			JSON.stringify({ type: 'answer', data: answer satisfies Answer } satisfies Message)
		);

		partySocket.addEventListener('message', (msg) => {
			const message = JSON.parse(msg.data);

			if (message.type === 'offer candidate') {
				pc?.addIceCandidate(new RTCIceCandidate(message.data as OfferCandidate));
			}
		});
	};
</script>

<div class="flex flex-col items-center p-24 space-y-24">
	<h1 class="text-4xl font-bold">PartyKit WebRTC Demo</h1>
	<div class="flex flex-row space-x-12 w-full">
		<!-- svelte-ignore a11y-media-has-caption -->
		<video
			id="localvideo"
			class="rounded-lg w-1/2 bg-slate-100"
			autoplay
			playsinline
			bind:this={localVideo}
		/>
		<!-- svelte-ignore a11y-media-has-caption -->
		<video
			id="remotevideo"
			class="rounded-lg w-1/2 bg-slate-100"
			autoplay
			playsinline
			bind:this={remoteVideo}
		/>
	</div>
	<div class="flex flex-row items-center space-x-12">
		<div class="flex flex-row space-x-4 items-center">
			<p class="text-2xl font-bold">
				Call ID: <span class="text-blue-500">{callId ?? 'Lobby'}</span>
			</p>
			<Button class="bg-blue-500 hover:bg-blue-600" on:click={startCall}>Start Call</Button>
		</div>
		<p class="text-2xl font-bold">Or</p>
		<div class="flex flex-row space-x-4">
			<Input class="border-slate-600" bind:value={callId} />
			<Button class="bg-blue-500 hover:bg-blue-600" on:click={joinCall}>Join Call</Button>
		</div>
	</div>
</div>
