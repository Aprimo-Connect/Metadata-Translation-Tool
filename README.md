```xml
<ref:httpRequest uri="https://aprimo-translation-api.vercel.app/api/webhook" timeout="15">
<Request>
<Headers>
<Header name="Authorization">Bearer THETOKEN</Header>
</Headers>
<Body>
{
  "recordId": <ref:record out="id" encode="json" />,
  "modifiedOn": <ref:record out="modifiedonutc" format="yyyy-MM-ddTHH:mm:ss.fff" encode="json" />,
  "modifiedBy": <ref:record out="modifiedby" format="N" encode="json" />,
  "translations": [
    {
      "source": {
        "fieldName": "AssetDescription",
        "languages": ["en-US"]
      },
      "destinations": [
        {
          "recordId": <ref:record out="id" encode="json" />,
          "fieldName": "TranslatedDescription",
          "languages": ["zh-CN"]
        },
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "fieldName": "TranslatedDescription",
          "languages": ["zh-CN"]
        }
        </ref:foreach>
      ]
    }
  ]
}
</Body>
</Request>
</ref:httpRequest>
```

```xml
<ref:httpRequest uri="https://aprimo-translation-api.vercel.app/api/webhook" timeout="15">
<Request>
<Headers>
<Header name="Authorization">Bearer THETOKEN</Header>
</Headers>
<Body>
{
  "recordId": <ref:record out="id" encode="json" />,
  "modifiedOn": <ref:record out="modifiedonutc" format="yyyy-MM-ddTHH:mm:ss.fff" encode="json" />,
  "modifiedBy": <ref:record out="modifiedby" format="N" encode="json" />,
  "translations": [
    {
      "source": {
        "fieldName": "EliteDescription",
        "languages": ["en-US"]
      },
      "destinations": [
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "fieldName": "EliteDescriptionML",
          "languages": ["zh-CN", "zh-TW"]
        }
        </ref:foreach>
      ]
    },
    {
      "source": {
        "fieldName": "EliteImageDescription",
        "languages": ["en-US"]
      },
      "destinations": [
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "fieldName": "EliteImageDescriptionML",
          "languages": ["zh-CN", "zh-TW"]
        }
        </ref:foreach>
      ]
    },
    {
      "source": {
        "fieldName": "EliteTags",
        "languages": ["en-US"]
      },
      "destinations": [
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "fieldName": "EliteTagsML",
          "languages": ["zh-CN", "zh-TW"]
        }
        </ref:foreach>
      ]
    }
  ]
}
</Body>
</Request>
</ref:httpRequest>
```

```xml
<ref:httpRequest uri="https://aprimo-translation-api.vercel.app/api/webhook" timeout="15">
<Request>
<Headers>
<Header name="Authorization">Bearer THETOKEN</Header>
</Headers>
<Body>
{
  "recordId": <ref:record out="id" encode="json" />,
  "modifiedOn": <ref:record out="modifiedonutc" format="yyyy-MM-ddTHH:mm:ss.fff" encode="json" />,
  "modifiedBy": <ref:record out="modifiedby" format="N" encode="json" />,
  "translations": [
    {
      "source": {
        "fieldNames": ["!AssetDescription", "SomeOtherField"],
        "languages": ["en-US"]
      },
      "destinations": [
        {
          "recordId": <ref:record out="id" encode="json" />,
          "languages": ["zh-CN"]
        },
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "languages": ["zh-CN"]
        }
        </ref:foreach>
      ]
    }
  ]
}
</Body>
</Request>
</ref:httpRequest>
```

```xml
<ref:httpRequest uri="https://aprimo-translation-api.vercel.app/api/webhook" timeout="15">
<Request>
<Headers>
<Header name="Authorization">Bearer THETOKEN</Header>
</Headers>
<Body>
{
  "recordId": <ref:record out="id" encode="json" />,
  "modifiedOn": <ref:record out="modifiedonutc" format="yyyy-MM-ddTHH:mm:ss.fff" encode="json" />,
  "modifiedBy": <ref:record out="modifiedby" format="N" encode="json" />,
  "translations": [
    {
      "source": {
        "languages": ["en-US"]
      },
      "destinations": [
        <ref:record fieldName="RelationshipLInk" out="valuechildren" store="@children" />
        <ref:foreach in="@children" storeitem="@child" join=",">
        {
          "recordId": <ref:record id="@child" out="id" encode="json" />,
          "languages": ["zh-CN", "fr-FR"]
        }
        </ref:foreach>
      ]
    }
  ]
}
</Body>
</Request>
</ref:httpRequest>
```