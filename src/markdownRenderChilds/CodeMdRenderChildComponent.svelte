<script lang="ts">
	import {CodeMdRenderChildData, LogLevel, logLevelRecord, PathMode} from './AbstractCodeMdRenderChild';
	import {Button, Select, SettingItem} from 'obsidian-svelte';
	import {getPlaceholderUUID, stripEmptyLinesAtBeginning} from '../utils/Utils';
	import {onMount} from 'svelte';

	export let data: CodeMdRenderChildData;
	export let idCommentPlaceholder: string;
	export let saveData: () => Promise<void>;
	export let sendToProcess: (data: string) => Promise<void>;
	export let runProcess: () => Promise<void>;
	export let killProcess: (reason?: Error | string) => Promise<boolean>;
	export let canSendToProcess: boolean;
	export let canKillProcess: boolean;
	export let canConfigureExecutionPath: boolean;

	onMount(() => {
	});


	export function update() {
		data = data;
	}

	export function updateConsole() {
		data.saveData.console = data.saveData.console;
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
		return logLevelRecord[level];
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

	function updateExecutionPathMode(mode: PathMode) {
		data.saveData.executionPath.mode = mode;
		saveData();
	}
</script>

<style>
	.flex-input-group {
		display:        flex;
		flex-direction: row;
		align-items:    center;
		gap:            var(--size-4-1);
	}

	.flex-input-group > .flex {
		flex: 1;
	}

	.input-group {
		padding:    var(--size-4-2) var(--size-4-1);
		margin-top: 1em;
		border-top: 1px solid var(--background-modifier-border);
	}

	.input-heading {
		color:       var(--text-normal);
		font-size:   var(--font-ui-medium);
		line-height: var(--line-height-tight);
	}

	.input-text {
		color:       var(--text-muted);
		font-size:   var(--font-ui-smaller);
		padding-top: var(--size-4-1);
		margin:      0;
		line-height: var(--line-height-tight);
	}

	.input-content {
		padding-top: var(--size-4-1);
		margin:      0;
	}

	.code-block {
		margin:  0;
		padding: var(--size-4-2) var(--size-4-4);
	}
</style>

<div class="card" style="background: var(--background-secondary)">
	<h3>Script Runner</h3>
	<div>
		<pre class={getCodeBlockLang()}><code class={getCodeBlockLang()}>{getCodeBlockContent()}</code></pre>
	</div>
	{#if data.id }
		<div class="script-runner-settings-group">
			{#if canConfigureExecutionPath}
				<div class="input-group">
					<span class="input-heading">Execution Path</span>
					<div class="input-content">
						<input style="width: 100%" type="text" placeholder="Execution Path"
							   bind:value={data.saveData.executionPath.path} on:change={saveData}/>
					</div>
					<div class="flex-input-group input-content">
						<div class="flex input-text">
							Execution path mode.
						</div>
						<Select
							options={Object.values(PathMode).map(x => { return { label: x.replaceAll('_', ' '), value: x } })}
							value={data.saveData.executionPath.mode}
							placeholder={PathMode.RELATIVE}
							on:change={(evt) => updateExecutionPathMode(evt.detail)}>
						</Select>
					</div>
				</div>
			{/if}


			<SettingItem
				name="Run"
				description="Run your script">
				{#if data.isRunning}
					{#if canKillProcess}
						<Button on:click={tryKillProcess} variant="destructive">Terminate</Button>
					{:else}
						<Button>Running...</Button>
					{/if}
				{:else}
					<Button on:click={tryRunProcess}>Run</Button>
				{/if}
			</SettingItem>

			<div class="input-group">
				<span class="input-heading">{data.hasRun ? 'Script Output' : 'Previous Output'}</span>
				{#if canSendToProcess && data.hasRun}
					<div class="flex-input-group input-content">
						<input class="flex" type="text" placeholder="Input" bind:value={data.input}/>
						<Button on:click={() => trySendToProcess(data.input)}>Send</Button>
					</div>
				{/if}
				<div class="input-content">
					<pre class="no-highlight code-block"><code>{#each data.saveData.console as logEntry}<span
						class={getClassForLogLevel(logEntry.level)}>{logEntry.message}</span>{/each}</code></pre>
				</div>
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
