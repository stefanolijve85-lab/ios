using Game.Core;
using Game.Economy;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Game.UI
{
    /// <summary>
    /// Bare-bones shop list. Real production version uses a virtualised list view.
    /// </summary>
    public sealed class ShopView : MonoBehaviour
    {
        [SerializeField] private Transform _content;
        [SerializeField] private GameObject _offerRowPrefab;

        private ShopService _shop;

        private void OnEnable()
        {
            _shop = ServiceLocator.Get<ShopService>();
            Rebuild();
        }

        private void Rebuild()
        {
            foreach (Transform child in _content) Destroy(child.gameObject);
            foreach (var offer in _shop.AllOffers())
            {
                var row = Instantiate(_offerRowPrefab, _content);
                row.GetComponentInChildren<TMP_Text>().text = $"{offer.DisplayName}  •  {offer.PriceCurrency} {offer.Price}";
                row.GetComponentInChildren<Button>().onClick.AddListener(() =>
                {
                    if (!_shop.TryPurchase(offer.Id, out var err))
                        Logger.Warn("Purchase failed: " + err);
                });
            }
        }
    }
}
