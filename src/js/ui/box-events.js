// js/box-events.js
import { t } from '../i18n/index.ts';
import { 
    parseTransform, getAllBoxPositions, showGuide, clearGuides, 
    rgbToHex, MIN_WIDTH, MIN_HEIGHT, SNAP_THRESHOLD,
    // NEW UTILITIES
    snapToGrid, bringToFront, sendToBack, copyStyles, pasteStyles,
    saveState, getSelectedBoxes, snapRotation, autoSave
} from './texbox_utils.js';
import { positionFabBesideBox } from './quillFloatingFab.ts';

// Global references passed from editor.js
let quillRef;
let deselectAllBoxesRef;
let enterEditModeRef;
let enterInPlaceEditModeRef;
let createBoxRef;
let updateTextboxListRef;
let fullScreenContainerRef;
let GRID_SIZE_REF = 10; // Default grid size

// NEW: References for enhanced features
let saveStateRef;
let getSelectedBoxesRef;

export function setBoxEventDependencies(quill, deselectAllBoxes, enterEditMode, enterInPlaceEditMode, createBox, updateTextboxList, fullScreenContainer, GRID_SIZE, saveState, getSelectedBoxes) {
    quillRef = quill;
    deselectAllBoxesRef = deselectAllBoxes;
    enterEditModeRef = enterEditMode;
    enterInPlaceEditModeRef = enterInPlaceEditMode;
    createBoxRef = createBox;
    updateTextboxListRef = updateTextboxList;
    fullScreenContainerRef = fullScreenContainer;
    GRID_SIZE_REF = GRID_SIZE;
    saveStateRef = saveState;
    getSelectedBoxesRef = getSelectedBoxes;
}

// Attach Events to a Single Box (Drag, Resize, Rotate, Toolbar)
export function attachBoxEvents(box) {
    const textDiv = box.querySelector(".txt");
    const resizeHandle = box.querySelector(".resize-handle");
    const rotateHandle = box.querySelector(".rotate-handle");
    const toolbar = box.querySelector(".toolbar");
    const btnFront = toolbar.querySelector(".front");
    const btnBack = toolbar.querySelector('.back');
    const btnDup = toolbar.querySelector(".duplicate");
    const btnDel = toolbar.querySelector(".delete");
    const btnLock = toolbar.querySelector(".lock");

    let isDragging = false, isResizing = false, isRotating = false;
    let locked = box.classList.contains('locked');
    let holdTimer = null;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let startWidth = 0, startHeight = 0;
    let rotation = 0;
    let startAngle = 0, startRotation = 0;
    let centerX = 0, centerY = 0;

    // NEW: Multi-select support
    let isMultiSelecting = false;
    let originalTransform = '';

    function readTransform() {
      const t = box.style.transform || '';
      const parsed = parseTransform(t);
      currentX = parsed.x; 
      currentY = parsed.y; 
      rotation = parsed.rot;
    }

    function updateTransform() {
      box.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;
      if (box.classList.contains('edit-mode')) {
        positionFabBesideBox(box);
      }
    }

    function saveBoxState() {
        const boxes = Array.from(document.querySelectorAll('.box'));
        if (saveStateRef) {
            saveStateRef(boxes);
        }
        try {
            autoSave(boxes);
        } catch (e) {
            console.warn('[BoxEvents] autoSave error:', e);
        }
    }

    // NEW: Enhanced click selection with multi-select support
    box.addEventListener('pointerdown', (e) => {
        // Check if multi-select mode is active (Ctrl/Cmd key or shift key)
        isMultiSelecting = e.ctrlKey || e.metaKey || e.shiftKey;

        // If the box is already in in-place edit mode, let the textDiv handle the focus/event
        if (box.querySelector('.txt.in-place-edit-active')) return;

        if (e.target === box || e.target === textDiv) {
            if (!isMultiSelecting) {
                if (deselectAllBoxesRef) deselectAllBoxesRef();
            }
            
            // Toggle selection in multi-select mode, otherwise just select
            if (isMultiSelecting) {
                box.classList.toggle('selected');
            } else {
                box.classList.add('selected');
            }

            // Store original transform for drag operations
            originalTransform = box.style.transform;
        }
    });

    // ENHANCED: Double-click & Mobile Double-Tap to enter in-place editor mode with floating Quill FAB
    const triggerInPlaceEdit = (e) => {
        if (locked) return;
        const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
        if (isMultiSelect) {
            box.classList.toggle('selected');
        } else {
            if (enterInPlaceEditModeRef) enterInPlaceEditModeRef(box);
        }
    };

    if (textDiv) {
        textDiv.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            triggerInPlaceEdit(e);
        });
    }

    box.addEventListener('dblclick', (e) => {
        if (e.target.closest('.resize-handle') || e.target.closest('.rotate-handle') || e.target.closest('.toolbar')) return;
        e.stopPropagation();
        triggerInPlaceEdit(e);
    });

    // Touch double-tap detection for mobile/tablet users
    let lastBoxTapTime = 0;
    box.addEventListener('touchend', (e) => {
        if (e.target.closest('.resize-handle') || e.target.closest('.rotate-handle') || e.target.closest('.toolbar')) return;
        const now = Date.now();
        const tapDiff = now - lastBoxTapTime;
        if (tapDiff > 50 && tapDiff < 360) {
            e.preventDefault();
            e.stopPropagation();
            triggerInPlaceEdit(e);
        }
        lastBoxTapTime = now;
    }, { passive: false });

    // ENHANCED: Direct mouse drag start or HOLD for touch with multi-select support
    const startBoxDrag = (clientX, clientY, pointerId) => {
        isDragging = true;
        readTransform();
        startX = clientX - currentX;
        startY = clientY - currentY;
        try { box.setPointerCapture(pointerId); } catch(_) {}

        // If multi-selecting, store original positions of all selected boxes
        if (isMultiSelecting && getSelectedBoxesRef) {
            const selectedBoxes = getSelectedBoxesRef();
            selectedBoxes.forEach(selectedBox => {
                if (selectedBox !== box) {
                    selectedBox.setAttribute('data-original-transform', selectedBox.style.transform);
                }
            });
        }

        window.addEventListener('pointermove', onBoxWindowPointerMove, { passive: false });
        window.addEventListener('pointerup', onBoxWindowPointerUp);
        window.addEventListener('pointercancel', onBoxWindowPointerUp);
    };

    const handleBoxMove = (clientX, clientY) => {
      if (locked || box.classList.contains('edit-mode') || !isDragging) return;
      
      let nx = clientX - startX;
      let ny = clientY - startY;

      // Apply grid snapping
      if (GRID_SIZE_REF > 0) {
        nx = snapToGrid(nx);
        ny = snapToGrid(ny);
      }

      if (clearGuides) clearGuides();
      
      // Multi-select drag - move all selected boxes
      if (isMultiSelecting && getSelectedBoxesRef) {
          const selectedBoxes = getSelectedBoxesRef();
          const deltaX = nx - currentX;
          const deltaY = ny - currentY;

          selectedBoxes.forEach(selectedBox => {
              if (selectedBox === box) {
                  currentX = nx;
                  currentY = ny;
                  updateTransform();
              } else {
                  const originalTransform = selectedBox.getAttribute('data-original-transform');
                  if (originalTransform) {
                      const parsed = parseTransform(originalTransform);
                      const newX = snapToGrid(parsed.x + deltaX);
                      const newY = snapToGrid(parsed.y + deltaY);
                      selectedBox.style.transform = `translate(${newX}px, ${newY}px) rotate(${parsed.rot}deg)`;
                  }
              }
          });

          // Show snap guides only for the primary box being dragged
          showSnapGuides(box, nx, ny);
      } else {
          // Single box drag with enhanced snapping
          const snappedPosition = calculateSnapPosition(box, nx, ny);
          currentX = snappedPosition.x;
          currentY = snappedPosition.y;
          updateTransform();
      }
    };

    const onBoxWindowPointerMove = (e) => {
      handleBoxMove(e.clientX, e.clientY);
    };

    const onBoxWindowPointerUp = (e) => {
      clearTimeout(holdTimer);
      window.removeEventListener('pointermove', onBoxWindowPointerMove);
      window.removeEventListener('pointerup', onBoxWindowPointerUp);
      window.removeEventListener('pointercancel', onBoxWindowPointerUp);

      if (isDragging) {
        isDragging = false;
        try { box.releasePointerCapture(e.pointerId); } catch(_) {}
        saveBoxState();
      }
      setTimeout(() => { if (clearGuides) clearGuides(); }, 300);
      isMultiSelecting = false;
    };

    box.addEventListener('pointerdown', (e) => {
      // Check if event is from an ancestor element being dragged or if in edit mode
      let target = e.target;
      while (target && target !== box) {
          if (target.classList.contains('resize-handle') || 
              target.classList.contains('rotate-handle') || 
              toolbar.contains(target) || 
              target.classList.contains('in-place-edit-active')) return;
          target = target.parentElement;
      }
      
      // Prevent drag if locked or in side-panel edit mode
      if (locked || box.classList.contains('edit-mode')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      // Check for multi-select
      isMultiSelecting = e.ctrlKey || e.metaKey || e.shiftKey;

      if (e.cancelable) e.preventDefault();

      if (e.pointerType === 'mouse') {
        // Immediate drag start for mouse
        startBoxDrag(e.clientX, e.clientY, e.pointerId);
      } else {
        // Comfortable touch hold delay
        holdTimer = setTimeout(() => {
          startBoxDrag(e.clientX, e.clientY, e.pointerId);
        }, 180);
      }
    });

    // ENHANCED: Drag move with multi-select support and improved snapping
    box.addEventListener('pointermove', (e) => {
      handleBoxMove(e.clientX, e.clientY);
    });

    // NEW: Enhanced snap position calculation
    function calculateSnapPosition(box, targetX, targetY) {
        const thisRect = box.getBoundingClientRect();
        const width = thisRect.width;
        const height = thisRect.height;

        let nx = targetX;
        let ny = targetY;

        const others = getAllBoxPositions(box);
        
        // Calculate current positions for snapping
        const left = Math.round(nx);
        const right = Math.round(nx + width);
        const centerXpos = Math.round(nx + width/2);
        const top = Math.round(ny);
        const bottom = Math.round(ny + height);
        const centerYpos = Math.round(ny + height/2);

        const vCandidates = [
            {name:'left', pos:left},
            {name:'centerX', pos:centerXpos},
            {name:'right', pos:right}
        ];
        const hCandidates = [
            {name:'top', pos:top},
            {name:'centerY', pos:centerYpos},
            {name:'bottom', pos:bottom}
        ];

        // Vertical snapping
        let snappedX = false;
        for (const other of others) {
            const otherVP = [
                {name:'left', pos:other.left},
                {name:'centerX', pos:other.centerX},
                {name:'right', pos:other.right}
            ];
            for (const mine of vCandidates) {
                for (const theirs of otherVP) {
                    const diff = Math.abs(mine.pos - theirs.pos);
                    if (diff <= SNAP_THRESHOLD) {
                        const delta = theirs.pos - mine.pos;
                        nx += delta;
                        if(fullScreenContainerRef) showGuide('vertical', { 
                            x: theirs.pos, 
                            y: 0, 
                            h: window.innerHeight 
                        }, fullScreenContainerRef);
                        vCandidates.forEach(c => c.pos += delta);
                        snappedX = true;
                        break;
                    }
                }
                if (snappedX) break;
            }
            if (snappedX) break;
        }

        // Horizontal snapping
        let snappedY = false;
        for (const other of others) {
            const otherHP = [
                {name:'top', pos:other.top},
                {name:'centerY', pos:other.centerY},
                {name:'bottom', pos:other.bottom}
            ];
            for (const mine of hCandidates) {
                for (const theirs of otherHP) {
                    const diff = Math.abs(mine.pos - theirs.pos);
                    if (diff <= SNAP_THRESHOLD) {
                        const delta = theirs.pos - mine.pos;
                        ny += delta;
                        if(fullScreenContainerRef) showGuide('horizontal', { 
                            x: 0, 
                            y: theirs.pos, 
                            w: window.innerWidth 
                        }, fullScreenContainerRef);
                        hCandidates.forEach(c => c.pos += delta);
                        snappedY = true;
                        break;
                    }
                }
                if (snappedY) break;
            }
            if (snappedY) break;
        }

        return { x: nx, y: ny };
    }

    // NEW: Show snap guides for a box at specified position
    function showSnapGuides(box, targetX, targetY) {
        const thisRect = box.getBoundingClientRect();
        const width = thisRect.width;
        const height = thisRect.height;

        const left = Math.round(targetX);
        const right = Math.round(targetX + width);
        const centerXpos = Math.round(targetX + width/2);
        const top = Math.round(targetY);
        const bottom = Math.round(targetY + height);
        const centerYpos = Math.round(targetY + height/2);

        const others = getAllBoxPositions(box);

        // Check for vertical snap
        for (const other of others) {
            if (Math.abs(left - other.left) <= SNAP_THRESHOLD || 
                Math.abs(left - other.right) <= SNAP_THRESHOLD ||
                Math.abs(left - other.centerX) <= SNAP_THRESHOLD) {
                if(fullScreenContainerRef) showGuide('vertical', { 
                    x: other.left, 
                    y: 0, 
                    h: window.innerHeight 
                }, fullScreenContainerRef);
            }
            if (Math.abs(centerXpos - other.left) <= SNAP_THRESHOLD || 
                Math.abs(centerXpos - other.right) <= SNAP_THRESHOLD ||
                Math.abs(centerXpos - other.centerX) <= SNAP_THRESHOLD) {
                if(fullScreenContainerRef) showGuide('vertical', { 
                    x: other.centerX, 
                    y: 0, 
                    h: window.innerHeight 
                }, fullScreenContainerRef);
            }
            if (Math.abs(right - other.left) <= SNAP_THRESHOLD || 
                Math.abs(right - other.right) <= SNAP_THRESHOLD ||
                Math.abs(right - other.centerX) <= SNAP_THRESHOLD) {
                if(fullScreenContainerRef) showGuide('vertical', { 
                    x: other.right, 
                    y: 0, 
                    h: window.innerHeight 
                }, fullScreenContainerRef);
            }
        }

        // Check for horizontal snap
        for (const other of others) {
            if (Math.abs(top - other.top) <= SNAP_THRESHOLD || 
                Math.abs(top - other.bottom) <= SNAP_THRESHOLD ||
                Math.abs(top - other.centerY) <= SNAP_THRESHOLD) {
                if(fullScreenContainerRef) showGuide('horizontal', { 
                    x: 0, 
                    y: other.top, 
                    w: window.innerWidth 
                }, fullScreenContainerRef);
            }
            if (Math.abs(centerYpos - other.top) <= SNAP_THRESHOLD || 
                Math.abs(centerYpos - other.bottom) <= SNAP_THRESHOLD ||
                Math.abs(centerYpos - other.centerY) <= SNAP_THRESHOLD) {
                if(fullScreenContainerRef) showGuide('horizontal', { 
                    x: 0, 
                    y: other.centerY, 
                    w: window.innerWidth 
                }, fullScreenContainerRef);
            }
            if (Math.abs(bottom - other.top) <= SNAP_THRESHOLD || 
                Math.abs(bottom - other.bottom) <= SNAP_THRESHOLD ||
                Math.abs(bottom - other.centerY) <= SNAP_THRESHOLD) {
                if(fullScreenContainerRef) showGuide('horizontal', { 
                    x: 0, 
                    y: other.bottom, 
                    w: window.innerWidth 
                }, fullScreenContainerRef);
            }
        }
    }

    box.addEventListener('pointerup', (e) => {
      clearTimeout(holdTimer);
      if (isDragging) {
        isDragging = false;
        try{ box.releasePointerCapture(e.pointerId); } catch(_) {}
        
        // NEW: Save state after drag operation
        saveBoxState();
      }
      setTimeout(() => { if (clearGuides) clearGuides(); }, 300);
      
      // Reset multi-select flag
      isMultiSelecting = false;
    });

    // ENHANCED: RESIZE handle with aspect ratio support (Mouse + Touch)
    if(resizeHandle) {
        const onResizeMove = (e) => {
          if (!isResizing || locked || box.classList.contains('edit-mode')) return;
          
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          
          let newW = Math.max(MIN_WIDTH, Math.round(startWidth + dx));
          let newH = Math.max(MIN_HEIGHT, Math.round(startHeight + dy));
          
          // NEW: Maintain aspect ratio when holding Shift key
          if (e.shiftKey) {
              const aspectRatio = startWidth / startHeight;
              if (Math.abs(dx) > Math.abs(dy)) {
                  newH = Math.round(newW / aspectRatio);
              } else {
                  newW = Math.round(newH * aspectRatio);
              }
              newW = Math.max(MIN_WIDTH, newW);
              newH = Math.max(MIN_HEIGHT, newH);
          }
          
          box.style.width = newW + 'px';
          box.style.height = newH + 'px';
        };

        const onResizeUp = (e) => {
          if (!isResizing) return;
          isResizing = false;
          window.removeEventListener('pointermove', onResizeMove);
          window.removeEventListener('pointerup', onResizeUp);
          window.removeEventListener('pointercancel', onResizeUp);
          try{ resizeHandle.releasePointerCapture(e.pointerId);}catch(_){}
          
          // NEW: Save state after resize
          saveBoxState();
        };

        resizeHandle.addEventListener('pointerdown', (e) => {
          if (locked || box.classList.contains('edit-mode')) return;
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
          isResizing = true;
          startX = e.clientX; 
          startY = e.clientY;
          startWidth = box.offsetWidth; 
          startHeight = box.offsetHeight;
          try { resizeHandle.setPointerCapture(e.pointerId); } catch(_) {}
          window.addEventListener('pointermove', onResizeMove, { passive: false });
          window.addEventListener('pointerup', onResizeUp);
          window.addEventListener('pointercancel', onResizeUp);
        });

        resizeHandle.addEventListener('pointermove', onResizeMove);
        resizeHandle.addEventListener('pointerup', onResizeUp);
    }

    // ENHANCED: ROTATE handle with angle snapping (Mouse + Touch)
    if(rotateHandle) {
        const onRotateMove = (e) => {
          if (!isRotating || locked || box.classList.contains('edit-mode')) return;
          const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          let newRotation = startRotation + (angle - startAngle) * (180/Math.PI);
          
          // NEW: Snap rotation when holding Shift key
          if (e.shiftKey) {
              newRotation = snapRotation(newRotation);
          }
          
          rotation = newRotation;
          updateTransform();
        };

        const onRotateUp = (e) => {
          if (!isRotating) return;
          isRotating = false;
          window.removeEventListener('pointermove', onRotateMove);
          window.removeEventListener('pointerup', onRotateUp);
          window.removeEventListener('pointercancel', onRotateUp);
          try{ rotateHandle.releasePointerCapture(e.pointerId);}catch(_){}
          
          // NEW: Save state after rotation
          saveBoxState();
        };

        rotateHandle.addEventListener('pointerdown', (e) => {
          if (locked || box.classList.contains('edit-mode')) return;
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
          isRotating = true;
          const rect = box.getBoundingClientRect();
          centerX = rect.left + rect.width/2;
          centerY = rect.top + rect.height/2;
          startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          startRotation = rotation;
          try { rotateHandle.setPointerCapture(e.pointerId); } catch(_) {}
          window.addEventListener('pointermove', onRotateMove, { passive: false });
          window.addEventListener('pointerup', onRotateUp);
          window.addEventListener('pointercancel', onRotateUp);
        });

        rotateHandle.addEventListener('pointermove', onRotateMove);
        rotateHandle.addEventListener('pointerup', onRotateUp);
    }

    // ENHANCED: Toolbar actions with new features
    if (btnDup) {
      btnDup.addEventListener('click', (ev) => {
        ev.stopPropagation();
        readTransform();
        const bgColor = window.getComputedStyle(box).backgroundColor;
        const animationClass = box.getAttribute('data-animation-class') || "";
        if (createBoxRef) {
            const newBox = createBoxRef(currentX + 20, currentY + 20, rotation, textDiv.innerHTML, rgbToHex(bgColor), animationClass);
            
            // NEW: Copy styles to duplicated box
            if (newBox) {
                copyStyles(box);
                pasteStyles(newBox);
            }
        }
      });
    }

    if (btnDel) {
      btnDel.addEventListener('click', (ev) => {
        ev.stopPropagation();
        box.remove();
        if (box.classList.contains('selected') && deselectAllBoxesRef) {
            deselectAllBoxesRef();
        }
        if (updateTextboxListRef) updateTextboxListRef();
        
        // NEW: Save state after deletion
        saveBoxState();
      });
    }

    if (btnLock) {
      btnLock.addEventListener('click', (ev) => {
        ev.stopPropagation();
        locked = !locked;
        if (locked) {
          box.classList.add('locked');
          btnLock.classList.add('locked');
          btnLock.innerHTML = `<i class="bi bi-unlock"></i> ${t('editor.unlock')}`;
          box.classList.remove('selected');
          if (deselectAllBoxesRef) deselectAllBoxesRef();
        } else {
          box.classList.remove('locked');
          btnLock.classList.remove('locked');
          btnLock.innerHTML = `<i class="bi bi-lock"></i> ${t('editor.lock')}`;
        }
        
        // NEW: Save state after lock/unlock
        saveBoxState();
      });
    }

    // ENHANCED: Z-index controls with utility functions
    if (btnFront) {
      btnFront.addEventListener('click', (ev) => {
        ev.stopPropagation();
        bringToFront(box);
        
        // NEW: Save state after z-index change
        saveBoxState();
      });
    }

    if (btnBack) {
      btnBack.addEventListener('click', (ev) => {
        ev.stopPropagation();
        sendToBack(box);
        
        // NEW: Save state after z-index change
        saveBoxState();
      });
    }

    // ENHANCED: keyboard controls with more shortcuts
    document.addEventListener('keydown', (e) => {
      // Check if any element is in in-place edit mode
      const isTypingInPlace = document.querySelector('.in-place-edit-active');

      // Only allow shortcuts if the box is selected and not actively typing
      if (box.classList.contains('selected') && !(quillRef && quillRef.hasFocus()) && !isTypingInPlace) {
          switch(e.key) {
              case 'Delete':
              case 'Backspace':
                  box.remove();
                  if (deselectAllBoxesRef) deselectAllBoxesRef();
                  if (updateTextboxListRef) updateTextboxListRef();
                  saveBoxState();
                  break;
              
              case 'd':
                  if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      readTransform();
                      const bgColor = window.getComputedStyle(box).backgroundColor;
                      const animationClass = box.getAttribute('data-animation-class') || "";
                      if (createBoxRef) {
                          const newBox = createBoxRef(currentX + 20, currentY + 20, rotation, textDiv.innerHTML, rgbToHex(bgColor), animationClass);
                          if (newBox) {
                              copyStyles(box);
                              pasteStyles(newBox);
                          }
                      }
                  }
                  break;
              
              // NEW: Arrow key nudging
              case 'ArrowUp':
                  if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      bringToFront(box);
                  } else if (e.altKey) {
                      e.preventDefault();
                      rotation += 1;
                      updateTransform();
                  } else {
                      e.preventDefault();
                      currentY -= (GRID_SIZE_REF > 0 ? GRID_SIZE_REF : 1);
                      updateTransform();
                  }
                  saveBoxState();
                  break;
              
              case 'ArrowDown':
                  if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      sendToBack(box);
                  } else if (e.altKey) {
                      e.preventDefault();
                      rotation -= 1;
                      updateTransform();
                  } else {
                      e.preventDefault();
                      currentY += (GRID_SIZE_REF > 0 ? GRID_SIZE_REF : 1);
                      updateTransform();
                  }
                  saveBoxState();
                  break;
              
              case 'ArrowLeft':
                  if (e.altKey) {
                      e.preventDefault();
                      rotation -= 1;
                      updateTransform();
                  } else {
                      e.preventDefault();
                      currentX -= (GRID_SIZE_REF > 0 ? GRID_SIZE_REF : 1);
                      updateTransform();
                  }
                  saveBoxState();
                  break;
              
              case 'ArrowRight':
                  if (e.altKey) {
                      e.preventDefault();
                      rotation += 1;
                      updateTransform();
                  } else {
                      e.preventDefault();
                      currentX += (GRID_SIZE_REF > 0 ? GRID_SIZE_REF : 1);
                      updateTransform();
                  }
                  saveBoxState();
                  break;
              
              // NEW: Copy/Paste styles with keyboard
              case 'c':
                  if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                      e.preventDefault();
                      copyStyles(box);
                  }
                  break;
              
              case 'v':
                  if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                      e.preventDefault();
                      pasteStyles(box);
                      saveBoxState();
                  }
                  break;
          }
      }
    });

    // ENHANCED: Context menu for additional options
    box.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        // Simple context menu implementation
        if (box.classList.contains('selected')) {
            const contextMenu = document.createElement('div');
            contextMenu.className = 'context-menu';
            contextMenu.style.cssText = `
                position: fixed;
                left: ${e.clientX}px;
                top: ${e.clientY}px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 4px;
                padding: 5px 0;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                min-width: 150px;
            `;
            
            contextMenu.innerHTML = `
                <div class="context-item" data-action="copy-style">Copy Style</div>
                <div class="context-item" data-action="paste-style">Paste Style</div>
                <div class="context-divider"></div>
                <div class="context-item" data-action="bring-front">Bring to Front</div>
                <div class="context-item" data-action="send-back">Send to Back</div>
                <div class="context-divider"></div>
                <div class="context-item" data-action="duplicate">Duplicate</div>
                <div class="context-item" data-action="delete">Delete</div>
            `;
            
            document.body.appendChild(contextMenu);
            
            // Handle context menu clicks
            contextMenu.querySelectorAll('.context-item').forEach(item => {
                item.addEventListener('click', (ev) => {
                    const action = ev.target.getAttribute('data-action');
                    switch(action) {
                        case 'copy-style':
                            copyStyles(box);
                            break;
                        case 'paste-style':
                            pasteStyles(box);
                            saveBoxState();
                            break;
                        case 'bring-front':
                            bringToFront(box);
                            saveBoxState();
                            break;
                        case 'send-back':
                            sendToBack(box);
                            saveBoxState();
                            break;
                        case 'duplicate':
                            readTransform();
                            const bgColor = window.getComputedStyle(box).backgroundColor;
                            const animationClass = box.getAttribute('data-animation-class') || "";
                            if (createBoxRef) {
                                const newBox = createBoxRef(currentX + 20, currentY + 20, rotation, textDiv.innerHTML, rgbToHex(bgColor), animationClass);
                                if (newBox) {
                                    copyStyles(box);
                                    pasteStyles(newBox);
                                }
                            }
                            break;
                        case 'delete':
                            box.remove();
                            if (deselectAllBoxesRef) deselectAllBoxesRef();
                            if (updateTextboxListRef) updateTextboxListRef();
                            saveBoxState();
                            break;
                    }
                    contextMenu.remove();
                });
            });
            
            // Close context menu when clicking outside
            setTimeout(() => {
                const closeMenu = (ev) => {
                    if (!contextMenu.contains(ev.target)) {
                        contextMenu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                };
                document.addEventListener('click', closeMenu);
            }, 100);
        }
    });

    // prevent pointerdown hiding selection when interacting children
    [resizeHandle, rotateHandle, toolbar].forEach(el => {
      if (el) {
          el.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      }
    });
    
    // Allow pointerdown on textDiv to keep the box selected
    if (textDiv) {
        textDiv.addEventListener('pointerdown', (ev) => {
            if (!textDiv.classList.contains('in-place-edit-active')) {
                ev.stopPropagation();
                if (deselectAllBoxesRef) deselectAllBoxesRef();
                box.classList.add('selected');
            }
        });
    }

    readTransform();
}

// NEW: Function to attach events to multiple boxes (for batch operations)
export function attachEventsToMultipleBoxes(boxes) {
    boxes.forEach(box => attachBoxEvents(box));
}

// NEW: Function to detach events from a box (for cleanup)
export function detachBoxEvents(box) {
    // Clone and replace to remove all event listeners
    const newBox = box.cloneNode(true);
    box.parentNode.replaceChild(newBox, box);
    return newBox;
}