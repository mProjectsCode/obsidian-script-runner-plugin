<script lang="ts">
	import {CodeMdRenderChild} from './CodeMdRenderChild';
	import {getPlaceholderUUID, stripEmptyLinesAtBeginning} from '../utils/Utils';
	import {Button, Select, SettingItem} from 'obsidian-svelte';
	import {PathMode} from '../RunConfiguration';
	import {LogLevel, logLevelRecord} from '../utils/PseudoConsole';
	import {onMount} from 'svelte';

	export let renderChild: CodeMdRenderChild;

	let sendInputInputFieldValue: string;

	onMount(() => {
	});

	export function update() {
		console.log('svelte update');
		renderChild = renderChild;
	}

	function getCodeBlockLang() {
		return `language-${renderChild.state.runConfig?.language}`;
	}

	function getCodeBlockContent() {
		if (!renderChild.state.uuid) {
			return renderChild.state.codeBlockContent;
		}

		let lines: string[] = renderChild.state.codeBlockContent.split('\n');
		// remove id comment
		lines = lines.slice(1);
		lines = stripEmptyLinesAtBeginning(lines);
		return lines.join('\n');
	}

	function getClassForLogLevel(level: LogLevel) {
		return logLevelRecord[level];
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
	{#if renderChild.state.uuid }
		<div class="script-runner-settings-group">
			{#if renderChild.state.languageConfig.permissions.canSpecifyExecutionPath}
				<div class="input-group">
					<span class="input-heading">Execution Path</span>
					<div class="input-content">
						<input style="width: 100%" type="text" placeholder="Execution Path"
							   bind:value={renderChild.state.runConfig.executionPath.path}/>
					</div>
					<div class="flex-input-group input-content">
						<div class="flex input-text">
							Execution path mode.
						</div>
						<Select
							options={Object.values(PathMode).map(x => { return { label: x.replaceAll('_', ' '), value: x } })}
							value={renderChild.state.runConfig?.executionPath?.mode}
							on:change={(evt) => renderChild.state.runConfig.executionPath.mode = evt.detail}>
						</Select>
					</div>
				</div>
			{/if}

			<SettingItem
				name="Run"
				description="Run your script">
				{#if renderChild.state.scriptState.isRunning}
					{#if renderChild.state.languageConfig?.permissions.canTerminateScript}
						<Button on:click={() => {renderChild.scriptRunner?.tryTerminateScript('user terminated')}}
								variant="destructive">Terminate
						</Button>
					{:else}
						<Button>Running...</Button>
					{/if}
				{:else}
					<Button on:click={() => {renderChild.scriptRunner.saveExecuteScript()}}>Run</Button>
				{/if}
			</SettingItem>

			<div class="input-group">
				<span
					class="input-heading">{renderChild.state.scriptState.hasRun ? 'Script Output' : 'Previous Output'}</span>
				{#if renderChild.state.languageConfig.permissions.canSendInput && renderChild.state.scriptState.hasRun}
					<div class="flex-input-group input-content">
						<input class="flex" type="text" placeholder="Input" bind:value={sendInputInputFieldValue}/>
						<Button on:click={() => {renderChild.scriptRunner?.trySendInput(sendInputInputFieldValue)}}>
							Send
						</Button>
					</div>
				{/if}
				<div class="input-content">
					<pre class="no-highlight code-block"><code>{#each renderChild.state.runConfig.scriptData.scriptConsole as logEntry}<span
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
			<code class="script-runner-error-ui">{renderChild.state.uuidParseError}</code>
			<p>
				The id comment should look like
			</p>
			<code>{renderChild.getIdCommentPlaceHolder()}</code>
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
