<template>
  <div
    ref="wrapper"
    class="result-graph__wrapper"
  >
    <div
      ref="graph"
      class="result-graph__container"
      :style="{ width: graphWidth + 'px' }"
    />
    <!-- Loading Overlay -->
    <div
      v-if="isGraphLoading"
      class="result-graph__loading-overlay"
    >
      <div
        class="spinner-border"
        role="status"
      >
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="result-graph__loading-text">
        Rendering Graph...
      </div>
    </div>
    
    <HoverContainer
      v-if="graphCreated"
      ref="hoverContainer"
      :schema="schema"
    />
    
    <div
      v-show="isSidePanelOpen"
      ref="sidePanel"
      class="result-graph__side-panel"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <div
        class="resize-handle"
        @mousedown="startResize"
      />
      <div class="result-graph__side-panel-content">
        <button
          class="result-graph__sidebar-button--close"
          @click="toggleSidePanel"
        >
          <i class="fa-solid fa-times" />
        </button>

        <div
          v-if="clickedIsNode"
          class="result-graph__actions"
        >
          <br>

          <h5>Actions</h5>
          <button
            class="btn btn-sm btn-outline-secondary"
            @click="hideNode()"
          >
            <i class="fa-solid fa-eye-slash" /> Hide Node
          </button>

          &nbsp;

          <button
            v-if="!isHighlightedMode"
            class="btn btn-sm btn-outline-secondary"
            @click="enableHighlightMode()"
          >
            <i class="fa-solid fa-arrows-to-circle" /> Highlight Mode
          </button>

          <button
            v-else
            class="btn btn-sm btn-outline-primary"
            @click="disableHighlightMode()"
          >
            <i class="fa-solid fa-arrows-to-circle" />
            Disable Highlight Mode
          </button>

          &nbsp;

          <button
            v-if="!isCurrentNodeExpanded"
            class="btn btn-sm btn-outline-secondary"
            @click="expandSelectedNode()"
          >
            <i class="fa-solid fa-up-down-left-right" />
            Expand Neighbors
          </button>

          <button
            v-else
            class="btn btn-sm btn-outline-primary"
            @click="collapseSelectedNode()"
          >
            <i class="fa-solid fa-up-down-left-right" />
            Collapse Neighbors
          </button>
        </div>

        <br>
        <div v-if="displayLabel">
          <div class="result-graph__summary-section">
            <h5>{{ sidePanelPropertyTitlePrefix }} Properties</h5>
          </div>
          <span
            class="badge bg-primary"
            :style="{
              backgroundColor: `${getColor(displayLabel)} !important`,
              color: `white !important`,
              textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            }"
          >
            {{ displayLabel }}</span>
          <hr>
          <table class="table table-sm table-borderless result-graph__result-table">
            <tbody>
              <tr
                v-for="property in displayProperties"
                :key="property.name"
              >
                <th scope="row">
                  {{ property.name }}
                  <span
                    v-if="property.isPrimaryKey"
                    class="badge bg-primary"
                    style="
                      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; 
                      color: white !important;"
                  >PK</span>
                </th>
                <td>{{ property.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else>
          <h5>Overview</h5>
          <div v-if="counters.total.node > 0">
            <div class="result-graph__summary-section">
              <p>
                Showing
                <span v-if="numHiddenNodes > 0">
                  {{ counters.total.node - numHiddenNodes }}/</span>{{ counters.total.node }} nodes
                <span v-if="numHiddenNodes > 0"> ({{ numHiddenNodes }} hidden) </span>
              </p>
              <button
                v-if="numHiddenNodes > 0"
                class="btn btn-sm btn-outline-secondary"
                @click="showAllNodesRels()"
              >
                <i class="fa-solid fa-eye" />
                Show All
              </button>
            </div>
            <hr>
            <table class="table table-sm table-borderless result-graph__overview-table">
              <tbody>
                <tr
                  v-for="label in Object.keys(counters.node)"
                  :key="label"
                >
                  <th scope="row">
                    <span
                      class="badge bg-primary"
                      :style="{ backgroundColor: ` ${getColor(label)} !important`, textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000', color: 'white !important' }"
                    >{{ label
                    }}</span>
                  </th>
                  <td>{{ counters.node[label] }}</td>
                </tr>
              </tbody>
            </table>
            <br>
          </div>

          <div v-if="counters.total.rel > 0">
            <p>
              Showing
              <span v-if="numHiddenRels > 0">
                {{ counters.total.rel - numHiddenRels }}/</span>{{ counters.total.rel }} rels
              <span v-if="numHiddenRels > 0"> ({{ numHiddenRels }} hidden) </span>
            </p>
            <hr>
            <table class="table table-sm table-borderless result-graph__overview-table">
              <tbody>
                <tr
                  v-for="label in Object.keys(counters.rel)"
                  :key="label"
                >
                  <th scope="row">
                    <span
                      class="badge bg-primary"
                      :style="{
                        backgroundColor: ` ${getColor(label)} !important`,
                        color: 'white !important',
                        textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                      }"
                    >
                      {{ label }}
                    </span>
                  </th>
                  <td>{{ counters.rel[label] }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="counters.total.node === 0 && counters.total.rel === 0">
            <p>
              <i class="fa-solid fa-circle-info" />
              No nodes or rels to show.
            </p>
          </div>
        </div>
      </div>
    </div>
    <button
      v-show="!isSidePanelOpen"
      class="result-graph__sidebar-button--open"
      data-bs-toggle="tooltip"
      data-bs-placement="right"
      data-bs-original-title="Open Sidebar"
      @click="toggleSidePanel"
    >
      <i class="fa-lg fa-solid fa-angle-left" />
    </button>
  </div>
</template>

<script lang="js">
import Sigma from 'sigma';
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { circular } from 'graphology-layout';
import { random } from 'graphology-layout';
import SigmaUtils from "../../utils/SigmaUtils";
import {
  DATA_TYPES, UI_SIZE, LOOP_POSITIONS, ARC_CURVE_OFFSETS
} from "../../utils/Constants";
import NeighborsFetcher from "../../utils/NeighborsFetcher";
import { useSettingsStore } from "../../store/SettingsStore";
import { useModeStore } from "../../store/ModeStore";
import { mapStores } from 'pinia'
import ValueFormatter from "../../utils/ValueFormatter";
import HoverContainer from "./HoverContainer.vue";

export default {
  name: "ResultGraph",
  components: {
    HoverContainer
  },
  props: {
    queryResult: {
      type: Object,
      required: false,
      default: null,
    },
    schema: {
      type: Object,
      required: false,
      default: null,
    },
    containerHeight: {
      type: String,
      required: false,
      default: "auto",
    },
    isMaximized: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ["graphEmpty"],
  data: () => ({
    graphCreated: false,
    isSidePanelOpen: false,
    isHighlightedMode: false,
    margin: UI_SIZE.DEFAULT_MARGIN,
    toolbarContainerWidth: UI_SIZE.SHELL_TOOL_BAR_WIDTH,
    sidebarWidth: 350,
    graphWidth: 0,
    borderWidth: UI_SIZE.DEFAULT_BORDER_WIDTH,
    numHiddenNodes: 0,
    numHiddenRels: 0,
    clickedProperties: [],
    clickedLabel: "",
    clickedIsNode: false,
    isCurrentNodeExpanded: false,
    delta: 0.05, // used for zooming, copied from G6
    zoomSensitivity: 2, // used for zooming, copied from G6
    toolbarDebounceTimeout: 100,
    toolbarDebounceTimer: null,
    counters: {
      node: {},
      rel: {},
      total: {
        node: 0,
        rel: 0,
      },
    },
    draggedNodeDebounceTimer: null,
    expansions: [],
    isResizing: false,
    minSidebarWidth: 350,
    maxSidebarWidth: 800,
    isGraphLoading: false, // Added loading state
  }),
  computed: {
    graphVizSettings() {
      return this.settingsStore.graphVizSettings;
    },
    performanceSettings() {
      return this.settingsStore.performance;
    },
    maximizeButtonClass() {
      return (this.isEditorMaximized ? "fa-minimize" : "fa-maximize") + " fa-lg fa-solid";
    },
    maximizeButtonTitle() {
      return this.isEditorMaximized ? "Minimize Graph" : "Maximize Graph";
    },
    sidePanelButtonClass() {
      return (this.isSidePanelOpen ? "fa-angle-right" : "fa-angle-left") + " fa-lg fa-solid";
    },
    sidePanelButtonTitle() {
      return this.isSidePanelOpen ? "Close Side Panel" : "Open Side Panel";
    },
    sidePanelPropertyTitlePrefix() {
      const isNode = this.clickedIsNode;
      return isNode ? "Node" : "Rel";
    },
    isNodeSelectedOrHovered() {
      return this.clickedLabel !== "";
    },
    displayLabel() {
      return this.clickedLabel;
    },
    displayProperties() {
      return this.clickedProperties;
    },
    ...mapStores(useSettingsStore, useModeStore),
    getTextColor() {
      return (label) => {
        const isNode = this.schema.nodeTables.find((table) => table.name === label);
        return isNode ? "#ffffff" : "#ffffff";
      };
    },
  },
  watch: {
    performanceSettings: {
      handler(newVal, oldVal) {
        if (newVal.maxNumberOfNodes !== oldVal.maxNumberOfNodes) {
          this.handleSettingsChange();
        }
      },
      deep: true,
    },
    graphVizSettings(newVal, oldVal) {
      let isRerenderNeeded = false;
      for (let key in this.counters.node) {
        if (newVal.nodes[key] && JSON.stringify(newVal.nodes[key]) !== JSON.stringify(oldVal.nodes[key])) {
          isRerenderNeeded = true;
          break;
        }
      }
      if (!isRerenderNeeded) {
        for (let key in this.counters.rel) {
          if (newVal.rels[key] && JSON.stringify(newVal.rels[key]) !== JSON.stringify(oldVal.rels[key])) {
            isRerenderNeeded = true;
            break;
          }
        }
      }
      if (!isRerenderNeeded) {
        return;
      }
      this.handleSettingsChange();
    },

    isSidePanelOpen(newVal) {
      this.$nextTick(() => {
        this.handleResize();
      });
    },
  },
  mounted() {
    // Initialize non-reactive Sigma.js properties
    this._sigmaGraph = null;
    this._graphData = null;
    this._layoutRunning = false;
    this._hoveredNode = null;
    this._hoveredEdge = null;
    this._clickedNode = null;
    this._clickedEdge = null;
    
    this.computeGraphWidth();
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("mousemove", this.handleResizeMove);
    window.addEventListener("mouseup", this.stopResize);
    if (this.isMaximized) {
      this.$nextTick(() => {
        this.handleResize();
      });
    }
  },
  beforeUnmount() {
    if (this._sigmaGraph) {
      this._sigmaGraph.kill();
    }
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("mousemove", this.handleResizeMove);
    window.removeEventListener("mouseup", this.stopResize);
  },
  methods: {
    getColor(label) {
      return this.settingsStore.colorForLabel(label);
    },
    getLayoutConfig(edges) {
      let nodeSpacing = edges.length * 8;
      nodeSpacing = nodeSpacing < 80 ? 80 : nodeSpacing;
      nodeSpacing = nodeSpacing > 500 ? 500 : nodeSpacing;
      const config = {
        nodeSpacing,
        type: 'force',
        preventOverlap: true,

      };
      return config;
    },
    
    applyLayout() {
      if (!this._graphData) return;
      
      // Start with random positions if nodes don't have positions
      random.assign(this._graphData);
      
      // Apply ForceAtlas2 layout
      const settings = forceAtlas2.inferSettings(this._graphData);
      settings.adjustSizes = false;
      settings.barnesHutOptimize = this._graphData.order > 100;
      settings.strongGravityMode = true;
      settings.gravity = 0.05;
      settings.scalingRatio = 10;
      settings.slowDown = 1;
      
      // Run layout for a fixed number of iterations
      this._layoutRunning = true;
      forceAtlas2.assign(this._graphData, { iterations: 300, settings });
      this._layoutRunning = false;
    },

    setupEventHandlers() {
      if (!this._sigmaGraph) return;

      // Node hover events
      this._sigmaGraph.on('enterNode', (event) => {
        const node = event.node;
        const nodeData = this._graphData.getNodeAttributes(node);
        this._hoveredNode = node;
        
        // Update node appearance for hover
        this._graphData.setNodeAttribute(node, 'color', '#1890FF');
        this._graphData.setNodeAttribute(node, 'borderColor', '#1890FF');
        this._graphData.setNodeAttribute(node, 'borderSize', 4);
        
        // Show hover tooltip
        if (this.$refs.hoverContainer) {
          const mockEvent = {
            clientX: event.event.clientX,
            clientY: event.event.clientY
          };
          this.$refs.hoverContainer.handleHover(nodeData, mockEvent);
        }
      });

      this._sigmaGraph.on('leaveNode', (event) => {
        const node = event.node;
        const nodeData = this._graphData.getNodeAttributes(node);
        this._hoveredNode = null;
        
        // Reset node appearance to original color
        this._graphData.setNodeAttribute(node, 'color', nodeData.originalColor);
        this._graphData.setNodeAttribute(node, 'borderColor', undefined);
        this._graphData.setNodeAttribute(node, 'borderSize', 0);
        
        // Hide hover tooltip
        if (this.$refs.hoverContainer) {
          this.$refs.hoverContainer.resetHover();
        }
      });

      // Node click events
      this._sigmaGraph.on('clickNode', (event) => {
        const node = event.node;
        const nodeData = this._graphData.getNodeAttributes(node);
        
        this.deselectAll();
        this._clickedNode = node;
        
        // Update node appearance for selection
        this._graphData.setNodeAttribute(node, 'borderColor', '#1848FF');
        this._graphData.setNodeAttribute(node, 'borderSize', 4);
        
        this.handleClick(nodeData);
        
        if (!this.isSidePanelOpen) {
          setTimeout(() => {
            this.isSidePanelOpen = true;
            this.$nextTick(() => {
              this.handleResize();
            });
          }, 200);
        }
      });

      // Node double click events
      this._sigmaGraph.on('doubleClickNode', (event) => {
        const node = event.node;
        const nodeData = this._graphData.getNodeAttributes(node);
        this.expandOnNode(nodeData);
      });

      // Edge hover events
      this._sigmaGraph.on('enterEdge', (event) => {
        const edge = event.edge;
        const edgeData = this._graphData.getEdgeAttributes(edge);
        this._hoveredEdge = edge;
        
        // Update edge appearance for hover
        this._graphData.setEdgeAttribute(edge, 'color', '#1890FF');
        this._graphData.setEdgeAttribute(edge, 'size', (edgeData.size || 5) * 1.5);
        
        // Show hover tooltip
        if (this.$refs.hoverContainer) {
          const mockEvent = {
            clientX: event.event.clientX,
            clientY: event.event.clientY
          };
          this.$refs.hoverContainer.handleHover(edgeData, mockEvent);
        }
      });

      this._sigmaGraph.on('leaveEdge', (event) => {
        const edge = event.edge;
        const edgeData = this._graphData.getEdgeAttributes(edge);
        this._hoveredEdge = null;
        
        // Reset edge appearance to original values
        this._graphData.setEdgeAttribute(edge, 'color', edgeData.originalColor);
        this._graphData.setEdgeAttribute(edge, 'size', edgeData.originalSize);
        
        // Hide hover tooltip
        if (this.$refs.hoverContainer) {
          this.$refs.hoverContainer.resetHover();
        }
      });

      // Edge click events
      this._sigmaGraph.on('clickEdge', (event) => {
        const edge = event.edge;
        const edgeData = this._graphData.getEdgeAttributes(edge);
        
        this.deselectAll();
        this.unhighlightEverything();
        this._clickedEdge = edge;
        
        // Update edge appearance for selection
        this._graphData.setEdgeAttribute(edge, 'color', '#1848FF');
        this._graphData.setEdgeAttribute(edge, 'size', (edgeData.size || 5) * 1.5);
        
        this.handleClick(edgeData);
        
        if (!this.isSidePanelOpen) {
          this.toggleSidePanel();
        }
      });

      // Canvas click events
      this._sigmaGraph.on('clickStage', () => {
        this.deselectAll();
        this.unhighlightEverything();
      });
    },

    drawGraph() {
      this.isGraphLoading = true; // Show loading overlay
      if (this.graphCreated && this._sigmaGraph) {
        this._sigmaGraph.kill();
      }
      if (!this.queryResult) {
        return;
      }
      const { counters, nodes, edges } = this.extractGraphFromQueryResult(this.queryResult);
      this.counters = counters;
      if (nodes.length === 0) {
        this.$emit("graphEmpty");
        return;
      }
      console.log("Nodes data sent to Sigma:", nodes);
      console.log("Edges data sent to Sigma:", edges);

      // Create new graphology instance (non-reactive)
      this._graphData = new Graph();

      // Add nodes to graphology
      nodes.forEach(node => {
        this._graphData.addNode(node.id, {
          x: Math.random() * 1000, // Will be overridden by layout
          y: Math.random() * 1000,
          size: node.size || 100,
          color: node.color || "#FF0000",
          originalColor: node.color || "#FF0000", // Store original color for reset
          label: node.label || "",
          properties: node.properties,
          originalNode: node
        });
      });

      // Add edges to graphology
      edges.forEach(edge => {
        // Check if both source and target nodes exist
        if (this._graphData.hasNode(edge.source) && this._graphData.hasNode(edge.target)) {
          this._graphData.addEdge(edge.source, edge.target, {
            size: edge.size || 5,
            color: edge.color || "#e2e2e2",
            originalColor: edge.color || "#e2e2e2", // Store original color for reset
            originalSize: edge.size || 5, // Store original size for reset
            label: edge.label || "",
            properties: edge.properties,
            originalEdge: edge
          });
        }
      });

      // Apply ForceAtlas2 layout
      this.applyLayout();

      const container = this.$refs.graph;
      
      // Create Sigma instance (non-reactive) 
      this._sigmaGraph = new Sigma(this._graphData, container, {
        labelFont: "Lexend, Helvetica Neue, Helvetica, Arial, sans-serif",
        labelSize: 12,
        labelWeight: "500",
        labelColor: "#ffffff",
        // Disable default label rendering so we can draw custom labels
        renderLabels: false,
        enableEdgeClickEvents: true,
        enableEdgeWheelEvents: true,
        enableEdgeHoverEvents: true,
        allowInvalidContainer: true,
        zIndex: true
      });

      // Add custom label rendering using the correct Sigma v3 API
      this._sigmaGraph.on("afterRender", () => {
        // Get the container canvas element
        const container = this._sigmaGraph.getContainer();
        const canvas = container.querySelector('canvas:last-child'); // Get the labels canvas
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        const camera = this._sigmaGraph.getCamera();
        
        this._graphData.forEachNode((nodeId, attributes) => {
          if (!attributes.label || attributes.hidden) return;
          
          // Get node position and convert to screen coordinates
          const nodePosition = this._graphData.getNodeAttributes(nodeId);
          const screenPos = this._sigmaGraph.graphToViewport(nodePosition);
          
          // Calculate appropriate font size based on zoom level
          const zoomLevel = camera.ratio;
          const baseFontSize = 12;
          const fontSize = Math.max(8, Math.min(24, baseFontSize / zoomLevel));
          
          // Configure text style
          context.fillStyle = attributes.labelColor || "#ffffff";
          context.font = `500 ${fontSize}px Lexend, Helvetica Neue, Arial, sans-serif`;
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.strokeStyle = "#000000";
          context.lineWidth = Math.max(1, 2 / zoomLevel);
          
          // Add text stroke for better readability
          context.strokeText(attributes.label, screenPos.x, screenPos.y);
          // Draw the actual text
          context.fillText(attributes.label, screenPos.x, screenPos.y);
        });
      });

      // Set up event handlers
      this.setupEventHandlers();

      this.graphCreated = true;

      // Fit the graph to view after rendering
      this.$nextTick(() => {
        this.fitToView();
        this.isGraphLoading = false; // Hide loading overlay after fit to view
      });
    },

    refreshDraggedNodePosition(node, x, y) {
      if (!this._graphData || !this._graphData.hasNode(node)) return;
      this._graphData.setNodeAttribute(node, 'x', x);
      this._graphData.setNodeAttribute(node, 'y', y);
    },

    hideNode() {
      if (!this._sigmaGraph || !this._graphData) {
        console.error('Graph not initialized');
        return;
      }

      if (!this._clickedNode) {
        console.error('No node selected');
        return;
      }

      try {
        const nodeId = this._clickedNode;
        this.numHiddenNodes += 1;
        
        // Hide node by setting its size to 0 or removing it temporarily
        this._graphData.setNodeAttribute(nodeId, 'hidden', true);
        this._graphData.setNodeAttribute(nodeId, 'size', 0);
        this.deselectAll();

        // Hide related edges
        this._graphData.forEachEdge((edge, attributes, source, target) => {
          if (source === nodeId || target === nodeId) {
            this.numHiddenRels += 1;
            this._graphData.setEdgeAttribute(edge, 'hidden', true);
            this._graphData.setEdgeAttribute(edge, 'size', 0);
          }
        });
      } catch (e) {
        console.error('Error hiding node:', e);
      }
    },

    enableHighlightMode() {
      this.isHighlightedMode = true;
      if (this._clickedNode) {
        const nodeData = this._graphData.getNodeAttributes(this._clickedNode);
        this.highlightNode(nodeData);
      }
    },

    disableHighlightMode() {
      this.unhighlightEverything();
      this.isHighlightedMode = false;
    },

    showAllNodesRels() {
      if (!this._graphData) return;
      
      // Show all hidden nodes
      this._graphData.forEachNode((node, attributes) => {
        if (attributes.hidden) {
          this._graphData.setNodeAttribute(node, 'hidden', false);
          this._graphData.setNodeAttribute(node, 'size', attributes.originalSettings?.size || 100);
        }
      });
      
      // Show all hidden edges
      this._graphData.forEachEdge((edge, attributes) => {
        if (attributes.hidden) {
          this._graphData.setEdgeAttribute(edge, 'hidden', false);
          this._graphData.setEdgeAttribute(edge, 'size', attributes.originalSettings?.size || 5);
        }
      });
      
      this.numHiddenNodes = 0;
      this.numHiddenRels = 0;
    },

    encodeId(id) {
      return `${id.table}_${id.offset}`;
    },

    extractGraphFromQueryResult(queryResult) {
      const rows = queryResult.rows;
      const dataTypes = queryResult.dataTypes;
      const nodes = {};
      const edges = {};
      const numberOfRelsBetweenNodes = {};
      const nodeLabels = {};

      const sortNodes = (src, dst) => {
        const sortedLabels = [src.table, dst.table].sort();
        const sortedSrcDst = [src.offset, dst.offset].sort();
        return [sortedLabels[0], sortedSrcDst[0], sortedLabels[1], sortedSrcDst[1]];
      }

      const increaseRelCounter = (src, dst) => {
        const sortedNodeInfo = sortNodes(src, dst);
        if (!numberOfRelsBetweenNodes[sortedNodeInfo[0]]) {
          numberOfRelsBetweenNodes[sortedNodeInfo[0]] = {};
        }
        if (!numberOfRelsBetweenNodes[sortedNodeInfo[0]][sortedNodeInfo[2]]) {
          numberOfRelsBetweenNodes[sortedNodeInfo[0]][sortedNodeInfo[2]] = {};
        }
        if (!numberOfRelsBetweenNodes[sortedNodeInfo[0]][sortedNodeInfo[2]][sortedNodeInfo[1]]) {
          numberOfRelsBetweenNodes[sortedNodeInfo[0]][sortedNodeInfo[2]][sortedNodeInfo[1]] = {};
        }
        const currentMap = numberOfRelsBetweenNodes[sortedNodeInfo[0]][sortedNodeInfo[2]][sortedNodeInfo[1]];
        if (!currentMap[sortedNodeInfo[3]]) {
          currentMap[sortedNodeInfo[3]] = 0;
        }
        currentMap[sortedNodeInfo[3]] += 1;
        return currentMap[sortedNodeInfo[3]];
      }

      const processNode = (rawNode) => {
        const nodeId = this.encodeId(rawNode._id);
        nodeLabels[rawNode._id.table] = rawNode._label;
        const nodeSettings = this.settingsStore.settingsForLabel(rawNode._label);
        
        // Get color directly from the store's colorForLabel function
        const nodeFill = this.settingsStore.colorForLabel(rawNode._label);
        
        // Extract other settings from g6Settings
        const g6Settings = nodeSettings?.g6Settings || {};
        const nodeSize = g6Settings.size || 100;
        const labelConfig = g6Settings.labelCfg || {};
        const labelStyle = labelConfig.style || {};
        
        const sigmaNode = {
          id: nodeId,
          properties: rawNode,
          size: nodeSize,
          color: nodeFill,
          borderColor: SigmaUtils.shadeColor(nodeFill),
          borderSize: 0,
          labelFont: labelStyle.fontFamily || "Lexend, Helvetica Neue, Helvetica, Arial, sans-serif",
          labelSize: labelStyle.fontSize || 14,
          labelWeight: labelStyle.fontWeight || "300",
          labelColor: SigmaUtils.getReadableTextColor(nodeFill),
          // Store original settings for reference
          originalSettings: g6Settings
        }
        
        if (nodes[nodeId]) {
          return;
        }
        
        const expectedPropertiesType = {};
        const expectedProperties = this.schema.nodeTables.find((table) => table.name === rawNode._label).properties;
        expectedProperties.forEach((property) => {
          expectedPropertiesType[property.name] = property.type;
        });
        
        const nodeLabelProp = nodeSettings.label;
        if (!nodeLabelProp) {
          sigmaNode.label = "";
        } else {
          sigmaNode.label = rawNode[nodeLabelProp];
          if (nodeLabelProp in expectedPropertiesType) {
            sigmaNode.label = ValueFormatter.beautifyValue(rawNode[nodeLabelProp], expectedPropertiesType[nodeLabelProp]);
          }
          sigmaNode.label = String(sigmaNode.label);
          const fontSize = labelStyle.fontSize || 14;
          // Truncate node label to fit within node
          sigmaNode.label = SigmaUtils.fittingString(sigmaNode.label, nodeSize - 6, fontSize);
        }
        
        nodes[nodeId] = sigmaNode;
      };

      const processRel = (rawRel) => {
        const relSettings = this.settingsStore.settingsForLabel(rawRel._label);
        const relId = this.encodeId(rawRel._id);
        const numberOfOverlappingRels = increaseRelCounter(rawRel._src, rawRel._dst);
        
        // Get color directly from the store's colorForLabel function
        const edgeColor = this.settingsStore.colorForLabel(rawRel._label);
        
        // Extract other settings from g6Settings
        const g6Settings = relSettings?.g6Settings || {};
        const edgeSize = g6Settings.size || 5;
        const labelConfig = g6Settings.labelCfg || {};
        const labelStyle = labelConfig.style || {};
        
        const sigmaEdge = {
          id: relId,
          properties: rawRel,
          source: this.encodeId(rawRel._src),
          target: this.encodeId(rawRel._dst),
          size: edgeSize,
          color: edgeColor,
          labelFont: labelStyle.fontFamily || "Lexend, Helvetica Neue, Helvetica, Arial, sans-serif",
          labelSize: labelStyle.fontSize || 12,
          labelWeight: labelStyle.fontWeight || "300",
          labelColor: "#000000",
          // Store curve info for multiple edges between same nodes
          curveOffset: numberOfOverlappingRels > 1 ? 
            ARC_CURVE_OFFSETS[(numberOfOverlappingRels - 1) % ARC_CURVE_OFFSETS.length] : 0,
          isLoop: false,
          // Store original settings for reference
          originalSettings: g6Settings
        }
        
        // Handle self-loops
        if (sigmaEdge.source === sigmaEdge.target) {
          sigmaEdge.isLoop = true;
          sigmaEdge.loopPosition = LOOP_POSITIONS[(numberOfOverlappingRels - 1) % LOOP_POSITIONS.length];
        }

        const expectedPropertiesType = {};
        const relTable = this.schema.relTables.find((table) => table.name === rawRel._label);
        const expectedProperties = relTable.properties;
        expectedProperties.forEach((property) => {
          expectedPropertiesType[property.name] = property.type;
        });
        
        const relLabelProp = relSettings.label;
        if (!relLabelProp) {
          sigmaEdge.label = "";
        } else {
          sigmaEdge.label = rawRel[relLabelProp];
          if (relLabelProp === '_label' && relTable.group) {
            sigmaEdge.label = relTable.group;
          }
          if (relLabelProp in expectedPropertiesType) {
            sigmaEdge.label = ValueFormatter.beautifyValue(rawRel[relLabelProp], expectedPropertiesType[relLabelProp]);
          }
          sigmaEdge.label = String(sigmaEdge.label);
          const fontSize = labelStyle.fontSize || 12;
          // Truncate edge label to max width 80px
          sigmaEdge.label = SigmaUtils.fittingString(sigmaEdge.label, 80, fontSize);
        }
        
        if (edges[relId]) {
          return;
        }
        edges[relId] = sigmaEdge;
      }
      // Deduplicate nodes and edges
      rows.forEach((row) => {
        for (let key in row) {
          switch (dataTypes[key]) {
            case DATA_TYPES.NODE: {
              if (!row[key] || !row[key]._id) {
                continue;
              }
              const node = { ...row[key] };
              processNode(node);
              break;
            }
            case DATA_TYPES.REL: {
              if (!row[key] || !row[key]._src || !row[key]._dst) {
                continue;
              }
              const rel = { ...row[key] };
              processRel(rel);
              break;
            }
            case DATA_TYPES.RECURSIVE_REL: {
              const recursiveRel = { ...row[key] };
              recursiveRel._nodes.forEach((node) => {
                node = { ...node };
                const nodeId = this.encodeId(node._id);
                if (nodes[nodeId]) {
                  return;
                }
                for (let key in node) {
                  if (node[key] === null || node[key] === undefined) {
                    delete node[key];
                  }
                }
                processNode(node);
              });
              recursiveRel._rels.forEach((rel) => {
                rel = { ...rel };
                const relId = this.encodeId(rel._id);
                if (edges[relId]) {
                  return;
                }
                for (let key in rel) {
                  if (rel[key] === null || rel[key] === undefined) {
                    delete rel[key];
                  }
                }
                processRel(rel);
              });
              break;
            }
            default:
              break;
          }
        }
      });
      if (Object.keys(nodes).length > this.settingsStore.performance.maxNumberOfNodes) {
        const nodeIds = Object.keys(nodes);
        while (nodeIds.length > this.settingsStore.performance.maxNumberOfNodes) {
          const indexToRemove = Math.floor(Math.random() * nodeIds.length);
          const nodeIdToRemove = nodeIds[indexToRemove];
          delete nodes[nodeIdToRemove];
          nodeIds.splice(indexToRemove, 1);
        }
        for (let key in edges) {
          const edge = edges[key];
          if (!nodes[edge.source] || !nodes[edge.target]) {
            delete edges[key];
          }
        }
      }
      const nodeCounters = {
      };
      for (let key in nodes) {
        const label = nodes[key].properties._label;
        if (!nodeCounters[label]) {
          nodeCounters[label] = 0;
        }
        nodeCounters[label] += 1;
      }
      const relCounters = {
      };
      for (let key in edges) {
        const label = edges[key].properties._label;
        if (!relCounters[label]) {
          relCounters[label] = 0;
        }
        relCounters[label] += 1;
      }
      const totalNodeCount = Object.values(nodeCounters).reduce((a, b) => a + b, 0);
      const totalRelCount = Object.values(relCounters).reduce((a, b) => a + b, 0);
      const counters = {
        node: nodeCounters,
        rel: relCounters,
        total: {
          node: totalNodeCount,
          rel: totalRelCount,
        },
      };
      return {
        counters,
        nodes: Object.values(nodes),
        edges: Object.values(edges),
        nodesMap: nodes,
        edgesMap: edges,
      };
    },

    handleResize() {
      this.$nextTick(() => {
        if (this._sigmaGraph) {
          // Sigma automatically handles canvas resizing
          this._sigmaGraph.refresh();
        }
      });
    },

    handleClick(model) {
      const label = model.properties._label;
      this.clickedLabel = label;
      this.clickedProperties = ValueFormatter.filterAndBeautifyProperties(model.properties, this.schema);
      this.clickedIsNode = !(model.properties._src && model.properties._dst);
      this.highlightNode(model);
      if (this.clickedIsNode) {
         this.isCurrentNodeExpanded = this.isNeighborExpanded(model);
      }
      if (!this.isSidePanelOpen) {
        // Add a small delay to avoid conflicting with double click
        window.setTimeout(() => {
          this.isSidePanelOpen = true;
          this.$nextTick(() => {
            this.handleResize();
          });
        }, 200);
      }
    },

    highlightNode(model) {
      if (!this.isHighlightedMode || !this._graphData) {
        return;
      }
      if (model.properties._src || model.properties._dst) {
        return;
      }
      
      const nodeId = model.id || model.properties._id && this.encodeId(model.properties._id);
      if (!nodeId) return;
      
      const connectedNodes = new Set();
      
      // First, dim all edges and find connected nodes
      this._graphData.forEachEdge((edge, attributes, source, target) => {
        if (!attributes.originalLabel) {
          this._graphData.setEdgeAttribute(edge, 'originalLabel', attributes.label);
        }
        
        if (source !== nodeId && target !== nodeId) {
          // Dim unconnected edges
          this._graphData.setEdgeAttribute(edge, 'color', '#cccccc');
          this._graphData.setEdgeAttribute(edge, 'size', (attributes.size || 5) * 0.3);
          this._graphData.setEdgeAttribute(edge, 'label', '');
        } else {
          // Keep connected edges visible
          this._graphData.setEdgeAttribute(edge, 'color', attributes.originalSettings?.style?.stroke || '#1890FF');
          this._graphData.setEdgeAttribute(edge, 'size', (attributes.size || 5) * 1.2);
          connectedNodes.add(source);
          connectedNodes.add(target);
          
          if (attributes.originalLabel) {
            this._graphData.setEdgeAttribute(edge, 'label', attributes.originalLabel);
          }
        }
      });
      
      // Dim unconnected nodes
      this._graphData.forEachNode((node, attributes) => {
        if (node !== nodeId && !connectedNodes.has(node)) {
          this._graphData.setNodeAttribute(node, 'color', '#cccccc');
          this._graphData.setNodeAttribute(node, 'size', (attributes.size || 100) * 0.5);
        } else {
          // Keep connected nodes visible
          this._graphData.setNodeAttribute(node, 'color', attributes.originalSettings?.style?.fill || attributes.color);
          this._graphData.setNodeAttribute(node, 'size', attributes.originalSettings?.size || attributes.size || 100);
        }
      });
    },

    unhighlightEverything() {
      if (!this.isHighlightedMode || !this._graphData) {
        return;
      }
      
      // Restore all nodes to original appearance
      this._graphData.forEachNode((node, attributes) => {
        this._graphData.setNodeAttribute(node, 'color', attributes.originalSettings?.style?.fill || attributes.color);
        this._graphData.setNodeAttribute(node, 'size', attributes.originalSettings?.size || 100);
      });
      
      // Restore all edges to original appearance
      this._graphData.forEachEdge((edge, attributes) => {
        this._graphData.setEdgeAttribute(edge, 'color', attributes.originalSettings?.style?.stroke || "#e2e2e2");
        this._graphData.setEdgeAttribute(edge, 'size', attributes.originalSettings?.size || 5);
        
        if (attributes.originalLabel) {
          this._graphData.setEdgeAttribute(edge, 'label', attributes.originalLabel);
          this._graphData.removeEdgeAttribute(edge, 'originalLabel');
        }
      });
    },

    getInfoForExpansion(model) {
      const tableName = model.properties._label;
      const primaryKey = this.schema.nodeTables
        .find((table) => table.name === tableName)
        .properties
        .find((prop) => prop.isPrimaryKey);
      const primaryKeyValue = model.properties[primaryKey.name];
      const primaryKeyName = primaryKey.name;
      return { tableName, primaryKey, primaryKeyValue, primaryKeyName };
    },

    async expandOnNode(model) {
      const { tableName, primaryKey, primaryKeyValue, primaryKeyName } = this.getInfoForExpansion(model);
      const sizeLimit = this.settingsStore.performance.maxNumberOfNodesToExpand;
      let neighbors = null;
      try {
        neighbors = await NeighborsFetcher.fetchNeighbors(
          tableName,
          primaryKeyName,
          primaryKeyValue,
          sizeLimit,
          this.modeStore.isWasm
        );
      } catch (e) {
        // Ignore error for now. Just don't expand if the core does not execute the query.
        console.error(e);
      }
      if (!neighbors) {
        return;
      }
      this.addDataWithQueryResult(neighbors);
      this.expansions.push({
        id: model.id, neighbors
      });
    },

    isNeighborExpanded(model) {
      const id = model.id;
      return this.expansions.some((e) => {
        return e.id === id;
      });
    },

    expandSelectedNode() {
      if (!this._clickedNode || !this._graphData) {
        return;
      }
      const nodeData = this._graphData.getNodeAttributes(this._clickedNode);
      this.expandOnNode(nodeData);
      this.deselectAll();
    },

    collapseNode(id) {
      const expansion = this.expansions.find((e) => e.id === id);
      if (!expansion) {
        return;
      }
      const neighbors = expansion.neighbors;
      this.expansions = this.expansions.filter((e) => e.id !== id);
      // Recursively collapse neighbors
      neighbors.rows.forEach((neighbor) => {
        if (neighbor.dst) {
          const id = this.encodeId(neighbor.dst._id);
          this.collapseNode(id);
        }
      });
    },

    collapseSelectedNode() {
      if (!this._clickedNode) {
        return;
      }
      this.collapseNode(this._clickedNode);
      this.handleSettingsChange();
      this.isCurrentNodeExpanded = false;
      this.deselectAll();
    },

    addDataWithQueryResult(queryResult) {
      const { nodes, edges } = this.extractGraphFromQueryResult(queryResult);
      this.addData(nodes, edges);
    },

    addData(nodes, edges) {
      if (!this._graphData) {
        return;
      }
      
      // Add new nodes
      nodes.forEach(node => {
        if (!this._graphData.hasNode(node.id)) {
          this._graphData.addNode(node.id, {
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            size: node.size || 100,
            color: node.color || "#FF0000",
            label: node.label || "",
            properties: node.properties,
            originalSettings: node.originalSettings
          });
          this.counters.node[node.properties._label] = (this.counters.node[node.properties._label] || 0) + 1;
          this.counters.total.node += 1;
        }
      });
      
      // Add new edges
      edges.forEach(edge => {
        if (!this._graphData.hasEdge(edge.id) && 
            this._graphData.hasNode(edge.source) && 
            this._graphData.hasNode(edge.target)) {
          this._graphData.addEdge(edge.source, edge.target, {
            size: edge.size || 5,
            color: edge.color || "#e2e2e2",
            label: edge.label || "",
            properties: edge.properties,
            originalSettings: edge.originalSettings
          });
          this.counters.rel[edge.properties._label] = (this.counters.rel[edge.properties._label] || 0) + 1;
          this.counters.total.rel += 1;
        }
      });
      
      // Apply layout to new nodes
      this.applyLayout();
    },

    deselectAll() {
      if (!this._graphData) {
        return;
      }
      
      // Reset selected node appearance
      if (this._clickedNode && this._graphData.hasNode(this._clickedNode)) {
        const nodeData = this._graphData.getNodeAttributes(this._clickedNode);
        this._graphData.setNodeAttribute(this._clickedNode, 'borderColor', nodeData.originalSettings?.style?.fill ? SigmaUtils.shadeColor(nodeData.originalSettings.style.fill) : undefined);
        this._graphData.setNodeAttribute(this._clickedNode, 'borderSize', 0);
      }
      
      // Reset selected edge appearance
      if (this._clickedEdge && this._graphData.hasEdge(this._clickedEdge)) {
        const edgeData = this._graphData.getEdgeAttributes(this._clickedEdge);
        this._graphData.setEdgeAttribute(this._clickedEdge, 'color', edgeData.originalSettings?.style?.stroke || "#e2e2e2");
        this._graphData.setEdgeAttribute(this._clickedEdge, 'size', edgeData.originalSettings?.size || 5);
      }
      
      this._clickedNode = null;
      this._clickedEdge = null;
      this.clickedLabel = "";
      this.clickedProperties = [];
      this.clickedIsNode = false;
    },

    toggleSidePanel() {
      this.isSidePanelOpen = !this.isSidePanelOpen;
      this.$nextTick(() => {
        this.handleResize();
      });
    },

    computeGraphWidth() {
      let width = document.documentElement.clientWidth || document.body.clientWidth;
      width -= this.margin * 2;
      width -= this.toolbarContainerWidth * 2;
      width -= 2 * this.borderWidth;
      this.graphWidth = width;
      return width;
    },

    zoomIn() {
      if (this.toolbarDebounceTimer) {
        clearTimeout(this.toolbarDebounceTimer);
      }
      this.toolbarDebounceTimer = setTimeout(() => {
        SigmaUtils.zoomIn(this._sigmaGraph);
      }, this.toolbarDebounceTimeout);
    },

    zoomOut() {
      if (this.toolbarDebounceTimer) {
        clearTimeout(this.toolbarDebounceTimer);
      }
      this.toolbarDebounceTimer = setTimeout(() => {
        SigmaUtils.zoomOut(this._sigmaGraph);
      }, this.toolbarDebounceTimeout);
    },

    fitToView() {
      if (this.toolbarDebounceTimer) {
        clearTimeout(this.toolbarDebounceTimer);
      }
      this.toolbarDebounceTimer = setTimeout(() => {
        SigmaUtils.fitToView(this._sigmaGraph);
      }, this.toolbarDebounceTimeout);
    },

    actualSize() {
      if (this.toolbarDebounceTimer) {
        clearTimeout(this.toolbarDebounceTimer);
      }
      this.toolbarDebounceTimer = setTimeout(() => {
        SigmaUtils.actualSize(this._sigmaGraph);
      }, this.toolbarDebounceTimeout);
    },

    handleSettingsChange() {
      // Redraw the entire graph with new settings
      this.drawGraph();
    },

    startResize(e) {
      this.isResizing = true;
      e.preventDefault();
    },

    handleResizeMove(e) {
      if (!this.isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= this.minSidebarWidth && newWidth <= this.maxSidebarWidth) {
        this.sidebarWidth = newWidth;
        this.$nextTick(() => {
          this.handleResize();
        });
      }
    },

    stopResize() {
      this.isResizing = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.result-graph__wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  position: relative;

  .result-graph__container {
    height: 100%;
    flex: 1 1 0%;
    min-width: 0;
    padding: 1rem;
  }

  .result-graph__loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--bs-body-bg);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10; /* Ensure it's above the graph */
    color: var(--bs-body-text);

    .spinner-border {
      margin-bottom: 10px;
      color: var(--bs-body-bg-accent);
    }
  }

  .result-graph__summary-section {
    display: flex;
    align-items: center;
    justify-content: space-between;

    p {
      display: inline-block;
      margin: 0;
    }

    button {
      padding: 5px;
      margin-right: 20px;
    }
  }

  .result-graph__side-panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    border-top-left-radius: 1rem;
    border-bottom-left-radius: 1rem;
    width: 350px;
    background-color: var(--bs-body-bg-secondary);
    z-index: 2;

    .resize-handle {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 5px;
      cursor: col-resize;
      background-color: transparent;
      transition: background-color 0.2s;
      z-index: 3;
      pointer-events: auto;

      &:hover, &:active {
        background-color: var(--bs-body-bg-accent);
      }

      &::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 2px;
        height: 30px;
        background-color: var(--bs-body-bg-accent);
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover::after, &:active::after {
        opacity: 1;
      }
    }

    .result-graph__side-panel-content {
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      padding: 1rem;
      padding-left: 1.5rem;
    }

    .result-graph__sidebar-button--close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--bs-body-text);
      z-index: 3;

      &:hover {
        opacity: 0.7;
      }
    }

    .result-graph__actions{
      
      gap: 3px;
    }

    table {
      
      table-layout: auto;
      border-collapse: collapse;
      border-radius: 1rem;
      overflow: hidden;
      background-color: var(--bs-body-bg);
      margin-bottom: 1rem;

      th, td {
        white-space: nowrap;
        overflow-x: auto;
        text-overflow: hidden;
        max-width: none;
      }

      th {
        padding-left: 6px;
        padding-top: 8px;
        max-width: 120px;
        word-break: break-word;
      }

      td {
        padding: 0.5rem 1rem;
        max-width: 200px;
        word-break: break-word;
      }

      &.result-graph__overview-table {
        table-layout: fixed;

        td {
          width: 120px;
        }
      }

      &.result-graph__result-table {
        font-family: "Lexend", Lexend, sans-serif;

        td {
          word-break: break-all;
          
        }
      }

      // Add thin scrollbar for horizontal overflow
      &::-webkit-scrollbar {
        height: 2px;
        background: var(--bs-body-bg-accent);
      }
      &::-webkit-scrollbar-thumb {
        background: var(--bs-body-bg-accent);
        border-radius: 3px;
      }
      scrollbar-width: thin;
      scrollbar-color: var(--bs-body-bg-accent) var(--bs-body-bg-secondary);
    }

    h5 {
      margin-bottom: 1rem;
      color: var(--bs-body-text);
    }

    hr {
      margin: 1rem 0;
      border-top: 1px solid var(--bs-body-inactive);
    }

    .badge {
      display: inline-block;
      background-color: var(--bs-body-bg-accent) !important;
      color: #fff !important;
      overflow: hidden;
      text-overflow: hidden;
      white-space: nowrap;
      vertical-align: middle;
    }

    button.btn-outline-secondary,
    button.btn-outline-primary {
      width: 100%;
      text-align: left;
      background-color: var(--bs-body-bg);
      color: var(--bs-body-text);
      border-color: transparent;
      border-radius: 0.5rem;

      &:hover {
        background-color: var(--bs-body-bg-hover);
      }

      i {
        margin-right: 0.5rem;
      }
    }

    button.btn-outline-primary {
      background-color: var(--bs-body-bg-accent);
      color: var(--bs-body-bg);
    }

    .badge.bg-primary {
      color: white !important;
    }
  }

  .result-graph__sidebar-button--open {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background-color: var(--bs-body-bg-secondary);
    border: 2px solid var(--bs-body-shell);
    border-radius: 0.5rem 0 0 0.5rem;
    padding: 0.5rem 0.25rem;
    cursor: pointer;
    color: var(--bs-body-text);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3rem;

    &:hover {
      opacity: 0.8;
    }

    i {
      font-size: 1.2rem;
    }
  }
}
</style>
