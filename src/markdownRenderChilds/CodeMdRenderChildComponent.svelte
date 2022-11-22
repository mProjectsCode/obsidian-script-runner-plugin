<script lang="ts">
	import {CodeMdRenderChildData, LogLevel} from './AbstractCodeMdRenderChild';
	import {Button, SettingItem, TextInput} from 'obsidian-svelte';
	import {getPlaceholderUUID, stripEmptyLinesAtBeginning} from '../utils/Utils';
	import {onMount} from 'svelte';

	export let data: CodeMdRenderChildData;
	export let idCommentPlaceholder: string;
	export let sendToProcess: (data: string) => Promise<void>;
	export let runProcess: () => Promise<void>;
	export let killProcess: (reason?: Error|string) => Promise<boolean>;
	export let canSendToProcess: boolean;
	export let canKillProcess: boolean;

	onMount(() => {
		console.log(data);
	});

	export function update() {
		data = data;
	}

	export function updateConsole() {
		data.console = data.console;
	}

	function tryRunProcess() {
		runProcess();
		data = data;
	}

	function tryKillProcess() {
		if (canKillProcess) {
			killProcess('User terminated Process');
			data = data;
		}
	}

	function trySendToProcess(d: string) {
		if (canSendToProcess) {
			sendToProcess(d);
			data = data;
		}
	}

	function getClassForLogLevel(level: LogLevel) {
		let logLevelMap: Record<LogLevel, string> = {
			[LogLevel.TRACE]: 'script-runner-trace-console',
			[LogLevel.INFO]: '',
			[LogLevel.WARN]: 'script-runner-warn-console',
			[LogLevel.ERROR]: 'script-runner-error-console',
		};

		return logLevelMap[level] ?? '';
	}

	function getCodeBlockLang() {
		return `language-${data.language}`;
	}

	function getCodeBlockContent() {
		if (!data.id) {
			return data.content;
		}

		let lines: string[] = data.content.split('\n');
		// remove id comment
		lines = lines.slice(1);
		lines = stripEmptyLinesAtBeginning(lines);
		return lines.join('\n');
	}
</script>

<div class="card" style="background: var(--background-secondary)">
	<h3>Script Runner</h3>
	<div>
		<pre class={getCodeBlockLang()} tabindex=0><code class={getCodeBlockLang()}>{getCodeBlockContent()}</code></pre>
	</div>
	{#if data.id }
		<div class="script-runner-settings-group">
			<SettingItem
				name="Run"
				description="Run your script">
				{#if data.running}
					{#if canKillProcess}
						<Button on:click={tryKillProcess} variant="destructive">Terminate</Button>
					{:else}
						<Button>Running...</Button>
					{/if}
				{:else}
					<Button on:click={tryRunProcess}>Run</Button>
				{/if}
			</SettingItem>
			{#if canSendToProcess}
				<div class="script-runner-row-flex">
					<TextInput class="script-runner-expand" bind:value={data.input}></TextInput>
					<Button on:click={sendToProcess(data.input)}>Input</Button>
				</div>
			{/if}
			<div>
				<pre class="language-console"><code>{#each data.console as logEntry}<span
					class={getClassForLogLevel(logEntry.level)}>{logEntry.message}</span>{/each}</code></pre>
			</div>
		</div>
	{:else}
		<div class="script-runner-settings-group">
			<h4>Missing Id</h4>
			<p>
				The code block is missing an id or the id comment is incorrect.
			</p>
			<p><b>Reason</b></p>
			<code class="script-runner-error-ui">{data.idError}</code>
			<p>
				The id comment should look like
			</p>
			<code>{idCommentPlaceholder}</code>
			<p>
				and be the first line in the code block.
			</p>
			<p>
				Where <code>{getPlaceholderUUID()}</code> is a unique id for this code block.
				You can generate UUIDs with the <code>Generate UUID</code> command.
			</p>
		</div>
	{/if}

</div>
