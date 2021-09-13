<script context="module">
	import { browser, dev } from '$app/env';

	// we don't need any JS on this page, though we'll load
	// it in dev so that we get hot module replacement...
	export const hydrate = dev;

	// ...but if the client-side router is already loaded
	// (i.e. we came here from elsewhere in the app), use it
	export const router = browser;

	// since there's no dynamic data here, we can prerender
	// it so that it gets served as a static asset in prod
	export const prerender = true;
</script>

<script>
	// https://codepen.io/akx/pen/QowEQqgit in
	function detectPeaks(data, windowWidth, threshold) {
		const peaks = [];
		for (let i = 0; i < data.length; i++) {
			const start = Math.max(0, i - windowWidth);
			const end = Math.min(data.length, i + windowWidth);
			let deltaAcc = 0;
			for (let a = start; a < end; a++) {
				deltaAcc += Math.abs(data[a - 1] - data[a]);
			}
			if (deltaAcc > threshold) {
				peaks.push(i);
			}
		}
		return peaks;
	}

	import { onMount } from 'svelte'; // run on browser, not the server

	let raw, mic, filtered;
	let recorders = [];

	const onStop = () => {
		mic.microphone.stop();
		recorders.forEach((rec) => {
			rec.stop();
		});
		recorders = [];
	};

	const onStart = () => {
		if (mic) {
			mic.microphone.destroy();
			mic.destroy();
			raw.destroy();
			filtered.destroy();
		}

		// microphone

		mic = WaveSurfer.create({
			container: '#mic',
			waveColor: 'black',
			interact: false,
			cursorWidth: 0,
			plugins: [WaveSurfer.microphone.create()]
		});

		mic.microphone.on('deviceReady', function (stream) {
			console.log('Device ready!', stream);
			raw.process(stream);
			filtered.process(stream);
		});

		mic.microphone.on('deviceError', function (code) {
			console.warn('Device error: ' + code);
		});

		// start the microphone
		mic.microphone.start();

		// raw wave

		raw = WaveSurfer.create({
			container: '#raw',
			waveColor: 'black',
			interact: false,
			cursorWidth: 0
		});
		raw.chunks = [];
		raw.process = (stream) => {
			const rec = new MediaRecorder(stream);
			rec.start(250);
			rec.ondataavailable = (event) => {
				raw.chunks.push(event.data);
				raw.loadBlob(new Blob(raw.chunks));
			};
			recorders.push(rec);
		};

		// filtered wave

		filtered = WaveSurfer.create({
			container: '#filtered',
			waveColor: 'black',
			interact: false,
			cursorWidth: 0
		});
		filtered.chunks = [];
		filtered.process = (stream) => {
			const audioContext = mic.backend.ac;
			const inputNode = audioContext.createMediaStreamSource(stream);
			const outputNode = audioContext.createMediaStreamDestination();

			// see https://biosignal.uconn.edu/wp-content/uploads/sites/2503/2018/09/07_Nam_2016_JBHI.pdf
			const filter = audioContext.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.value = 500;
			// Q = center_frequency / (top_frequency - bottom_frequency)
			filter.Q.value = 500 / (5000 - 500);

			inputNode.connect(filter);
			filter.connect(outputNode);

			const rec = new MediaRecorder(outputNode.stream);
			rec.start(250);

			rec.ondataavailable = (event) => {
				filtered.chunks.push(event.data);
				filtered.loadBlob(new Blob(filtered.chunks));
			};
			recorders.push(rec);
		};

		// pause rendering
		//wavesurfer.microphone.pause();

		// resume rendering
		//wavesurfer.microphone.play();

		// stop visualization and disconnect microphone
		//wavesurfer.microphone.stopDevice();

		// same as stopDevice() but also clears the wavesurfer canvas
		//wavesurfer.microphone.stop();

		// destroy the plugin
		//wavesurfer.microphone.destroy();

		/*
		Connecting Filters
With the WebAudio or the MediaElementWebAudio backend you can insert your own Web Audio nodes into the graph using the method setFilter(). Example:

var lowpass = wavesurfer.backend.ac.createBiquadFilter();
wavesurfer.backend.setFilter(lowpass);

		*/
	};
</script>

<svelte:head>
	<title>Puffer</title>
	<script src="https://unpkg.com/wavesurfer.js"></script>
	<script
		src="https://unpkg.com/wavesurfer.js@5.2.0/dist/plugin/wavesurfer.microphone.min.js"></script>
</svelte:head>

<div class="content">
	<h1>Breathe into the mic</h1>
	<button on:click={onStart}>start</button>
	<button on:click={onStop}>stop</button>

	<h2>microphone</h2>
	<div id="mic" />
	<h2>raw audio</h2>
	<div id="raw" />
	<h2>filtered</h2>
	<div id="filtered" />
</div>
