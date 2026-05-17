using Game.Core;
using Game.Data;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Game.Gameplay
{
    /// <summary>
    /// Converts touch drag into <see cref="LaunchAiming"/> and <see cref="LaunchReleased"/> events.
    /// One-handed UX: hit-box for the slingshot is the entire lower-left screen quadrant by default.
    /// </summary>
    public sealed class DragAim : MonoBehaviour
    {
        [SerializeField] private GameTuning _tuning;
        [SerializeField] private Transform _anchor;
        [SerializeField] private Camera _cam;

        private bool _dragging;
        private Vector2 _dragStartScreen;

        private void Reset() { _cam = Camera.main; }

        private void OnEnable()
        {
            EnhancedTouchSupport.Enable();
        }

        private void OnDisable() => EnhancedTouchSupport.Disable();

        private void Update()
        {
            var touches = UnityEngine.InputSystem.EnhancedTouch.Touch.activeTouches;
            if (touches.Count == 0) { if (_dragging) Cancel(); return; }

            var t = touches[0];
            switch (t.phase)
            {
                case UnityEngine.InputSystem.TouchPhase.Began:
                    _dragging = true;
                    _dragStartScreen = t.screenPosition;
                    break;

                case UnityEngine.InputSystem.TouchPhase.Moved:
                case UnityEngine.InputSystem.TouchPhase.Stationary:
                    if (!_dragging) return;
                    Vector2 drag = (Vector2)_cam.ScreenToWorldPoint(t.screenPosition) - (Vector2)_cam.ScreenToWorldPoint(_dragStartScreen);
                    drag = Vector2.ClampMagnitude(drag, _tuning.MaxDragMagnitude);
                    EventBus<LaunchAiming>.Publish(new LaunchAiming(drag));
                    break;

                case UnityEngine.InputSystem.TouchPhase.Ended:
                    if (!_dragging) return;
                    Vector2 finalDrag = (Vector2)_cam.ScreenToWorldPoint(t.screenPosition) - (Vector2)_cam.ScreenToWorldPoint(_dragStartScreen);
                    finalDrag = Vector2.ClampMagnitude(finalDrag, _tuning.MaxDragMagnitude);
                    // Pull-back = launch forward.
                    Vector2 launchVec = -finalDrag;
                    float charge = launchVec.magnitude / _tuning.MaxDragMagnitude;
                    EventBus<LaunchReleased>.Publish(new LaunchReleased(launchVec, charge));
                    _dragging = false;
                    break;

                case UnityEngine.InputSystem.TouchPhase.Canceled:
                    Cancel();
                    break;
            }
        }

        private void Cancel() { _dragging = false; EventBus<LaunchCanceled>.Publish(default); }
    }
}
